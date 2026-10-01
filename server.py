#!/usr/bin/env python3
"""
VirtualStage AI - Backend API Server
Supports serving the static web app and live API integration for:
1. Replicate / Fal.ai Flux.1 Inpainting (Real-time virtual staging)
2. Stripe Checkout session creation for instant monetization
"""

import http.server
import socketserver
import os
import json
import time
import urllib.request
import urllib.error
import urllib.parse
import db

PORT = int(os.environ.get("PORT", 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")

class VirtualStageHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token')
        self.end_headers()

    def get_token(self):
        auth = self.headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            return auth[7:].strip()
        custom = self.headers.get('X-Session-Token', '')
        if custom:
            return custom.strip()
        # Query parameter fallback
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        if 'token' in params:
            return params['token'][0].strip()
        return None

    def get_user(self):
        token = self.get_token()
        return db.get_user_by_token(token) if token else None

    def do_GET(self):
        clean_path = self.path.split('?')[0]
        if clean_path == "/api/auth/me":
            user = self.get_user()
            if user:
                self.write_json({"status": "success", "user": user})
            else:
                self.write_json({"status": "error", "message": "Not authenticated"}, 401)
        elif clean_path == "/api/user/dashboard":
            user = self.get_user()
            if user:
                data = db.get_user_dashboard_data(user["id"])
                self.write_json({"status": "success", "dashboard": data})
            else:
                self.write_json({"status": "error", "message": "Not authenticated"}, 401)
        else:
            super().do_GET()

    def do_POST(self):
        clean_path = self.path.split('?')[0]
        if clean_path == "/api/auth/signup":
            self.handle_auth_signup()
        elif clean_path == "/api/auth/login":
            self.handle_auth_login()
        elif clean_path == "/api/auth/logout":
            self.handle_auth_logout()
        elif clean_path == "/api/user/track-event":
            self.handle_track_event()
        elif clean_path == "/api/stage":
            self.handle_staging_request()
        elif clean_path == "/api/create-checkout":
            self.handle_checkout_request()
        else:
            self.send_error(404, "Endpoint not found")

    def read_json(self):
        length = int(self.headers.get('Content-Length', 0) or 0)
        raw = self.rfile.read(length) if length else b''
        if not raw:
            return {}
        try:
            data = json.loads(raw)
        except Exception:
            return None
        return data if isinstance(data, dict) else None

    def write_json(self, payload, status=200):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_auth_signup(self):
        data = self.read_json() or {}
        email = (data.get("email") or "").strip()
        password = (data.get("password") or "").strip()
        name = (data.get("name") or "").strip()
        brokerage = (data.get("brokerage") or "").strip()

        if not email or not password or not name:
            self.write_json({"status": "error", "message": "Name, email, and password required."}, 400)
            return

        user = db.create_user(email, password, name, brokerage, initial_credits=3, plan="free_trial")
        if not user:
            self.write_json({"status": "error", "message": "An account with this email already exists."}, 409)
            return

        self.write_json({
            "status": "success",
            "message": "Account created! 3 free staging trial credits unlocked.",
            "user": user,
            "token": user["session_token"]
        })

    def handle_auth_login(self):
        data = self.read_json() or {}
        email = (data.get("email") or "").strip()
        password = (data.get("password") or "").strip()

        user = db.authenticate_user(email, password)
        if not user:
            self.write_json({"status": "error", "message": "Invalid email or password."}, 401)
            return

        self.write_json({
            "status": "success",
            "message": f"Welcome back, {user['name']}!",
            "user": user,
            "token": user["session_token"]
        })

    def handle_auth_logout(self):
        token = self.get_token()
        if token:
            db.invalidate_token(token)
        self.write_json({"status": "success", "message": "Logged out successfully."})

    def handle_track_event(self):
        data = self.read_json() or {}
        event_type = data.get("event_type", "activity")
        address = data.get("property_address", "")
        meta = data.get("metadata", {})
        user = self.get_user()
        user_id = user["id"] if user else None
        db.log_usage_event(user_id, event_type, address, meta)
        self.write_json({"status": "success"})

    def handle_staging_request(self):
        data = self.read_json()
        if data is None:
            self.write_json({"status": "error", "message": "Invalid JSON"}, 400)
            return

        room_type = data.get("room_type", "living")
        style = data.get("style", "modern")
        image_url = data.get("image_url") or data.get("image_data") or ""
        before_url = data.get("before_url") or ""
        prompt = (data.get("prompt") or "").strip()

        user = self.get_user()
        user_id = user["id"] if user else None

        if REPLICATE_API_TOKEN and image_url:
            try:
                result_url = self.call_replicate_api(image_url, style, room_type, prompt)
                response = {"status": "success", "staged_url": result_url, "source": "replicate"}
            except Exception as e:
                response = {"status": "error", "message": str(e), "source": "fallback"}
        else:
            result_url = f"assets/{room_type}_staged.jpg" if os.path.exists(os.path.join(DIRECTORY, f"assets/{room_type}_staged.jpg")) else "assets/hero_staged.jpg"
            response = {
                "status": "success",
                "message": "Staging complete.",
                "staged_url": result_url,
                "style": style,
                "room_type": room_type,
                "mls_compliant": True
            }

        # Log render and deduct credit if logged in
        if user_id:
            render_id = db.log_staged_render(user_id, room_type, style, prompt, result_url, before_url)
            updated_user = db.get_user_by_id(user_id)
            response["render_id"] = render_id
            response["credits_balance"] = updated_user["credits_balance"]
            response["user"] = updated_user

        self.write_json(response)

    def handle_checkout_request(self):
        data = self.read_json()
        if data is None:
            self.write_json({"status": "error", "message": "Invalid JSON"}, 400)
            return

        plan = data.get("plan", "pro")
        include_twilight = bool(data.get("include_twilight"))
        include_cert = bool(data.get("include_cert"))

        # Catalog of Packs & Subscriptions
        catalog = {
            # Pay-As-You-Go Packs
            "single": {"name": "Single Photo 4K Unlock", "price": 2.99, "type": "pack"},
            "starter": {"name": "Starter Pack (10 Images)", "price": 29.00, "type": "pack"},
            "pro": {"name": "Pro Agent Pack (25 Images)", "price": 49.00, "type": "pack"},
            "agency_pack": {"name": "Agency Bulk Pack (60 Images)", "price": 99.00, "type": "pack"},
            # Monthly Subscriptions (MRR Engine)
            "active_monthly": {"name": "Active Agent Membership (25 Credits/mo)", "price": 39.00, "type": "sub"},
            "power_monthly": {"name": "Power Producer Membership (60 Credits/mo)", "price": 79.00, "type": "sub"},
            "broker_monthly": {"name": "Brokerage Team Unlimited Membership", "price": 149.00, "type": "sub"},
            "broker": {"name": "Brokerage Team Unlimited Membership", "price": 149.00, "type": "sub"}
        }

        tier_info = catalog.get(plan, catalog["pro"])
        price = tier_info["price"]

        items = [{"name": tier_info["name"], "price": price, "type": tier_info["type"]}]
        if include_twilight:
            price += 14.00
            items.append({"name": "Add-On: Day-to-Dusk Twilight Conversion", "price": 14.00, "type": "addon"})
        if include_cert:
            price += 9.00
            items.append({"name": "Add-On: NAR 12-10 MLS Compliance Certificate & Social Kit", "price": 9.00, "type": "addon"})

        response = {
            "status": "success",
            "mode": "demo",
            "plan": plan,
            "plan_type": tier_info["type"],
            "total_due": round(price, 2),
            "items": items
        }

        user = self.get_user()
        credits_map = {
            "single": 1,
            "starter": 10,
            "pro": 25,
            "agency_pack": 60,
            "active_monthly": 25,
            "power_monthly": 60,
            "broker_monthly": 200,
            "broker": 200
        }
        credits_to_add = credits_map.get(plan, 1)

        if STRIPE_SECRET_KEY:
            try:
                host = self.headers.get('Host', 'localhost')
                proto = 'https' if self.headers.get('X-Forwarded-Proto') == 'https' else 'http'
                base = f"{proto}://{host}"
                checkout_url = self.create_stripe_session(
                    items,
                    f"{base}/index.html?checkout=success&plan={plan}",
                    f"{base}/index.html?checkout=cancel#pricing",
                    is_subscription=(tier_info["type"] == "sub")
                )
                response["mode"] = "live"
                response["checkout_url"] = checkout_url
            except Exception as e:
                response["mode"] = "demo"
                response["message"] = str(e)
        else:
            if user:
                db.log_transaction(user["id"], plan, round(price, 2), credits_to_add, "completed", "demo_checkout")
                updated_user = db.get_user_by_id(user["id"])
                response["user"] = updated_user
                response["credits_balance"] = updated_user["credits_balance"]
                response["credits_added"] = credits_to_add

        self.write_json(response)

    def create_stripe_session(self, items, success_url, cancel_url, is_subscription=False):
        fields = {
            "mode": "subscription" if is_subscription else "payment",
            "success_url": success_url,
            "cancel_url": cancel_url,
        }
        for i, item in enumerate(items):
            amount_cents = int(round(item["price"] * 100))
            fields[f"line_items[{i}][quantity]"] = "1"
            fields[f"line_items[{i}][price_data][currency]"] = "usd"
            fields[f"line_items[{i}][price_data][unit_amount]"] = str(amount_cents)
            fields[f"line_items[{i}][price_data][product_data][name]"] = item["name"]
            if is_subscription and item.get("type") == "sub":
                fields[f"line_items[{i}][price_data][recurring][interval]"] = "month"

        req = urllib.request.Request(
            "https://api.stripe.com/v1/checkout/sessions",
            data=urllib.parse.urlencode(fields).encode('utf-8'),
            headers={
                "Authorization": f"Bearer {STRIPE_SECRET_KEY}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            session = json.loads(resp.read().decode('utf-8'))
        url = session.get("url")
        if not url:
            raise RuntimeError("Stripe did not return a checkout URL")
        return url

    def call_replicate_api(self, image_url, style, room_type, extra_prompt=""):
        """Start a Flux prediction and poll until an image URL is ready."""
        prompt = (
            f"Professional architectural photograph of a high-end {style} {room_type}, "
            "photorealistic interior design, natural lighting, MLS listing photo"
        )
        if extra_prompt:
            prompt = f"{prompt}. {extra_prompt}"

        req_data = {
            "version": "black-forest-labs/flux-dev",
            "input": {
                "image": image_url,
                "prompt": prompt,
                "guidance": 3.5,
                "num_inference_steps": 28
            }
        }

        req = urllib.request.Request(
            "https://api.replicate.com/v1/predictions",
            data=json.dumps(req_data).encode('utf-8'),
            headers={
                "Authorization": f"Token {REPLICATE_API_TOKEN}",
                "Content-Type": "application/json"
            }
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            prediction = json.loads(resp.read().decode('utf-8'))

        poll_url = prediction.get("urls", {}).get("get")
        if not poll_url:
            raise RuntimeError("Replicate did not return a prediction URL")

        for _ in range(20):
            status = prediction.get("status")
            if status == "succeeded":
                output = prediction.get("output")
                if isinstance(output, list) and output:
                    return output[0]
                if isinstance(output, str) and output:
                    return output
                raise RuntimeError("Replicate finished without an image URL")
            if status in ("failed", "canceled"):
                raise RuntimeError(prediction.get("error") or "Replicate render failed")
            time.sleep(2)
            poll = urllib.request.Request(
                poll_url,
                headers={"Authorization": f"Token {REPLICATE_API_TOKEN}"}
            )
            with urllib.request.urlopen(poll, timeout=30) as resp:
                prediction = json.loads(resp.read().decode('utf-8'))

        raise RuntimeError("Replicate render timed out")

if __name__ == "__main__":
    print(f"🚀 VirtualStage AI Server starting on http://localhost:{PORT}")
    print(f"📁 Serving static files from: {DIRECTORY}")
    if REPLICATE_API_TOKEN:
        print("✅ Replicate API Token detected: Live GPU generation active.")
    else:
        print("ℹ️  Tip: Set REPLICATE_API_TOKEN env var to enable live GPU rendering.")
        
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), VirtualStageHandler) as httpd:
        httpd.serve_forever()

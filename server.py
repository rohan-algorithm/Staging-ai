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
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/stage":
            self.handle_staging_request()
        elif self.path == "/api/create-checkout":
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

    def handle_staging_request(self):
        data = self.read_json()
        if data is None:
            self.write_json({"status": "error", "message": "Invalid JSON"}, 400)
            return

        room_type = data.get("room_type", "living")
        style = data.get("style", "modern")
        image_url = data.get("image_url") or data.get("image_data") or ""
        prompt = (data.get("prompt") or "").strip()

        if REPLICATE_API_TOKEN and image_url:
            try:
                result_url = self.call_replicate_api(image_url, style, room_type, prompt)
                response = {"status": "success", "staged_url": result_url, "source": "replicate"}
            except Exception as e:
                response = {"status": "error", "message": str(e), "source": "fallback"}
        else:
            response = {
                "status": "success",
                "message": "Sample preview. Set REPLICATE_API_TOKEN for live rendering.",
                "style": style,
                "room_type": room_type,
                "mls_compliant": True
            }

        self.write_json(response)

    def handle_checkout_request(self):
        data = self.read_json()
        if data is None:
            self.write_json({"status": "error", "message": "Invalid JSON"}, 400)
            return

        plan = data.get("plan", "pro")
        include_twilight = bool(data.get("include_twilight"))
        prices = {"single": 2.99, "starter": 29.00, "pro": 49.00, "broker": 99.00}
        names = {
            "single": "Single photo unlock",
            "starter": "Starter pack — 10 images",
            "pro": "Pro pack — 25 images",
            "broker": "Brokerage plan"
        }
        price = prices.get(plan, 49.00)
        if include_twilight and plan != "broker":
            price += 14.00

        response = {
            "status": "success",
            "mode": "demo",
            "plan": plan,
            "total_due": round(price, 2)
        }

        if STRIPE_SECRET_KEY and plan != "broker":
            try:
                host = self.headers.get('Host', 'localhost')
                proto = 'https' if self.headers.get('X-Forwarded-Proto') == 'https' else 'http'
                base = f"{proto}://{host}"
                checkout_url = self.create_stripe_session(
                    names.get(plan, "VirtualStage AI"),
                    int(round(price * 100)),
                    f"{base}/index.html?checkout=success",
                    f"{base}/index.html?checkout=cancel#pricing"
                )
                response["mode"] = "live"
                response["checkout_url"] = checkout_url
            except Exception as e:
                response["mode"] = "demo"
                response["message"] = str(e)

        self.write_json(response)

    def create_stripe_session(self, name, amount_cents, success_url, cancel_url):
        fields = {
            "mode": "payment",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "line_items[0][quantity]": "1",
            "line_items[0][price_data][currency]": "usd",
            "line_items[0][price_data][unit_amount]": str(amount_cents),
            "line_items[0][price_data][product_data][name]": name,
        }
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

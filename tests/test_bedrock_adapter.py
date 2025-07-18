import sys
from pathlib import Path

# Ensure backend modules can be imported
BACKEND_DIR = Path(__file__).resolve().parents[1] / "packages" / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import bedrock_adapter  # type: ignore


def test_create_returns_chat_format(monkeypatch):
    adapter = bedrock_adapter.BedrockAdapter(
        api_base="http://bedrock", api_key="key", model_id="model"
    )

    captured = {}

    def fake_request(payload):
        captured["payload"] = payload
        return {"choices": [{"message": {"content": "ok"}}]}

    monkeypatch.setattr(adapter, "_request", fake_request)

    messages = [{"role": "user", "content": "hi"}]
    resp = adapter.create("model", messages)

    assert captured["payload"]["model"] == "model"
    assert captured["payload"]["messages"] == messages
    assert resp["choices"][0]["message"]["content"] == "ok"


def test_request_disables_proxies(monkeypatch):
    adapter = bedrock_adapter.BedrockAdapter(
        api_base="http://bedrock", api_key="key", model_id="model"
    )

    captured = {}

    def fake_post(url, headers=None, json=None, timeout=None, verify=None, proxies=None):
        captured["proxies"] = proxies

        class Resp:
            def raise_for_status(self):
                pass

            def json(self):
                return {}

        return Resp()

    monkeypatch.setattr(bedrock_adapter.requests, "post", fake_post)
    adapter._request({})
    assert captured["proxies"] == {"http": None, "https": None}

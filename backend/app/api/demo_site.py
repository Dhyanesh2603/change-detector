from datetime import datetime, timezone
from fastapi import APIRouter, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/demo-site", tags=["Demo Sandbox Target"])

# In-memory sandbox state
sandbox_state = {
    "title": "CloudScale DevOps Platform",
    "version": "v1.4.0",
    "price": "$49 / month",
    "discount": None,
    "banner": "Welcome to CloudScale! Build, test, and deploy faster with automated workflows.",
    "features": [
        "Automated continuous delivery pipelines",
        "Zero-downtime rolling deployments",
        "Real-time telemetry and APM metrics",
        "24/7 Priority developer support",
    ],
    "maintenance_notice": None,
    "last_mutated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
}

DEFAULT_STATE = dict(sandbox_state)
DEFAULT_STATE["features"] = list(sandbox_state["features"])


class MutateRequest(BaseModel):
    action: str  # "price_drop", "release_v2", "maintenance", "reset", "custom"
    custom_price: Optional[str] = None
    custom_banner: Optional[str] = None
    custom_feature: Optional[str] = None


@router.get("", response_class=HTMLResponse)
async def get_demo_site():
    """
    Renders a live target website for Change Detector to monitor.
    Playwright visits this real HTML page and captures screenshots and text DOM.
    """
    price_html = f"<span class='text-3xl font-extrabold text-neutral-900'>{sandbox_state['price']}</span>"
    if sandbox_state.get("discount"):
        price_html += f" <span class='ml-2 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300'>{sandbox_state['discount']}</span>"

    banner_html = ""
    if sandbox_state.get("banner"):
        banner_html = f"""
        <div class="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="text-amber-600 font-bold">📢 Notice:</span>
                <span>{sandbox_state['banner']}</span>
            </div>
            <span class="text-xs text-amber-600 font-mono">Updated: {sandbox_state['last_mutated_at']}</span>
        </div>
        """

    notice_html = ""
    if sandbox_state.get("maintenance_notice"):
        notice_html = f"""
        <div class="mb-6 p-4 rounded-lg bg-red-50 border border-red-300 text-red-900 text-sm flex items-center gap-2">
            <span class="text-red-600 font-bold">⚠️ Urgent Alert:</span>
            <span>{sandbox_state['maintenance_notice']}</span>
        </div>
        """

    features_li = "".join([f"<li class='flex items-center gap-2 text-sm text-neutral-700 py-1.5 border-b border-neutral-100'><span class='text-emerald-500 font-bold'>✓</span> <span>{f}</span></li>" for f in sandbox_state["features"]])

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{sandbox_state['title']} - {sandbox_state['version']}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
    </style>
</head>
<body class="bg-neutral-50 text-neutral-900 min-h-screen">
    <!-- Top Interactive Sandbox Control Bar -->
    <div class="bg-neutral-900 text-neutral-200 px-4 py-3 border-b border-neutral-800 sticky top-0 z-50 shadow-md">
        <div class="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="font-mono font-bold text-neutral-100">CHANGE DETECTOR TEST TARGET</span>
                <span class="text-neutral-500">|</span>
                <span class="text-neutral-400">Track this URL: <code class="bg-neutral-800 px-1.5 py-0.5 rounded text-amber-300">http://127.0.0.1:5000/demo-site</code></span>
            </div>
            <div class="flex flex-wrap items-center gap-2 font-mono">
                <span class="text-neutral-400">Quick Change Controls:</span>
                <button onclick="mutate('price_drop')" class="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold cursor-pointer transition">
                    💸 Drop Price ($49 → $29)
                </button>
                <button onclick="mutate('release_v2')" class="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition">
                    🚀 Release v2.0 & AI Feature
                </button>
                <button onclick="mutate('maintenance')" class="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer transition">
                    ⚠️ Post Alert Banner
                </button>
                <button onclick="mutate('reset')" class="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer transition">
                    🔄 Reset Baseline
                </button>
            </div>
        </div>
    </div>

    <!-- Main Webpage Content -->
    <main class="max-w-4xl mx-auto p-6 sm:p-12">
        {notice_html}
        {banner_html}

        <div class="text-center space-y-4 mb-10">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-200 text-neutral-800 font-mono text-xs font-semibold">
                <span>Release Status:</span>
                <span class="text-emerald-700 font-bold">{sandbox_state['version']}</span>
            </div>
            <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-950">
                {sandbox_state['title']}
            </h1>
            <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
                Next-generation infrastructure management and observability suite built for distributed engineering teams.
            </p>
        </div>

        <!-- Pricing Card -->
        <div class="max-w-md mx-auto bg-white rounded-xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div class="space-y-1">
                <div class="text-xs font-mono font-bold uppercase text-neutral-500 tracking-wider">Developer Pro Tier</div>
                <div class="flex items-baseline pt-2">
                    {price_html}
                </div>
                <div class="text-xs text-neutral-500">Billed monthly. Unlimited monitoring targets.</div>
            </div>

            <div class="space-y-2">
                <div class="text-xs font-bold uppercase text-neutral-900 tracking-wide">Included Features:</div>
                <ul class="space-y-1">
                    {features_li}
                </ul>
            </div>

            <button class="w-full py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm transition">
                Start 14-Day Free Trial
            </button>
        </div>

        <div class="mt-12 text-center text-xs font-mono text-neutral-400">
            Page Generation: {sandbox_state['last_mutated_at']} &bull; Playwright Monitored DOM Target
        </div>
    </main>

    <script>
        async function mutate(action) {{
            try {{
                const res = await fetch('/demo-site/mutate', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{ action: action }})
                }});
                if (res.ok) {{
                    window.location.reload();
                }}
            }} catch (err) {{
                alert('Mutation failed: ' + err);
            }}
        }}
    </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content, status_code=200)


@router.post("/mutate")
async def mutate_demo_site(body: MutateRequest):
    """
    Mutates content on the demo site so Change Detector can detect real diffs.
    """
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    sandbox_state["last_mutated_at"] = now_str

    if body.action == "price_drop":
        sandbox_state["price"] = "$29 / month"
        sandbox_state["discount"] = "FLASH SALE: 40% OFF"
        sandbox_state["banner"] = f"🔥 Special Flash Sale active! Pricing dropped from $49 to $29."
    elif body.action == "release_v2":
        sandbox_state["version"] = "v2.0.0-PRO"
        sandbox_state["title"] = "CloudScale AI Platform"
        if "AI-powered automated root-cause analysis" not in sandbox_state["features"]:
            sandbox_state["features"].append("AI-powered automated root-cause analysis")
            sandbox_state["features"].append("Sub-millisecond global edge caching")
        sandbox_state["banner"] = f"🚀 v2.0.0 Launched! Added AI root-cause analysis and global edge routing."
    elif body.action == "maintenance":
        sandbox_state["maintenance_notice"] = f"Emergency database migration scheduled for 02:00 UTC. Expect 5m downtime."
    elif body.action == "reset":
        sandbox_state.clear()
        sandbox_state.update(DEFAULT_STATE)
        sandbox_state["features"] = [
            "Automated continuous delivery pipelines",
            "Zero-downtime rolling deployments",
            "Real-time telemetry and APM metrics",
            "24/7 Priority developer support",
        ]
        sandbox_state["last_mutated_at"] = now_str

    return {
        "success": True,
        "action": body.action,
        "current_state": sandbox_state
    }


@router.get("/state")
async def get_state():
    return sandbox_state


@router.post("/reset")
async def reset_demo_site():
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    sandbox_state.clear()
    sandbox_state.update(DEFAULT_STATE)
    sandbox_state["features"] = [
        "Automated continuous delivery pipelines",
        "Zero-downtime rolling deployments",
        "Real-time telemetry and APM metrics",
        "24/7 Priority developer support",
    ]
    sandbox_state["last_mutated_at"] = now_str
    return {"success": True, "state": sandbox_state}

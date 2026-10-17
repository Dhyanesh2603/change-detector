from datetime import datetime, timezone
from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/demo-site", tags=["Demo Sandbox Target"])

# In-memory sandbox state representing a real-world SaaS company
sandbox_state = {
    "site_title": "ApexCloud - Autonomous Cloud Infrastructure",
    "version": "v1.4.0",
    "theme": "default", # "default" or "redesign_v3"
    "hero_headline": "Deploy resilient cloud infrastructure in seconds.",
    "hero_subhead": "Automated zero-downtime rolling deployments, real-time APM telemetry, and distributed edge computing designed for modern engineering teams.",
    "starter_price": "$0",
    "pro_price": "$49",
    "enterprise_price": "$199",
    "pro_discount_badge": None,
    "stock_status": "in_stock", # "in_stock" or "sold_out"
    "banner_notice": None,
    "alert_notice": None,
    "policy_notice": None,
    "features": [
        "Automated continuous delivery pipelines",
        "Multi-region failover orchestration",
        "Sub-millisecond edge caching layer",
        "Real-time distributed tracing & APM",
        "Role-based access control (RBAC)",
    ],
    "last_mutated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
}

DEFAULT_STATE = dict(sandbox_state)
DEFAULT_STATE["features"] = list(sandbox_state["features"])


class MutateRequest(BaseModel):
    action: str  # "price_drop", "stock_out", "policy_update", "major_redesign", "reset"


@router.get("", response_class=HTMLResponse)
async def get_demo_site():
    """
    Renders an interactive, real-world SaaS target webpage.
    The top control bar allows the user to instantly trigger major DOM mutations,
    making it effortless to demonstrate Change Detector during interviews.
    """
    # Dynamic Badges & Highlights
    price_badge = ""
    if sandbox_state.get("pro_discount_badge"):
        price_badge = f"""<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">{sandbox_state['pro_discount_badge']}</span>"""

    # Inventory / Stock Status
    if sandbox_state["stock_status"] == "sold_out":
        stock_badge = """<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>Capacity Reached &bull; Sold Out (Waitlist Only)</span>
        </span>"""
        cta_button = """<button disabled class="w-full py-2.5 px-4 rounded-lg bg-neutral-800 text-neutral-500 font-semibold text-sm cursor-not-allowed">
            Currently Unavailable (Join Waitlist)
        </button>"""
    else:
        stock_badge = """<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Dedicated Clusters In Stock (14 Units Available)</span>
        </span>"""
        cta_button = """<button class="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-100 text-neutral-950 font-semibold text-sm transition shadow-sm cursor-pointer">
            Deploy Pro Cluster Today
        </button>"""

    # Banner Notices
    banner_html = ""
    if sandbox_state.get("banner_notice"):
        banner_html = f"""
        <div class="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-center justify-between shadow-xs">
            <div class="flex items-center gap-2.5">
                <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-neutral-950">FLASH PROMO</span>
                <span>{sandbox_state['banner_notice']}</span>
            </div>
            <span class="text-xs text-amber-400/80 font-mono hidden sm:inline">{sandbox_state['last_mutated_at']}</span>
        </div>
        """

    alert_html = ""
    if sandbox_state.get("alert_notice"):
        alert_html = f"""
        <div class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm flex items-center gap-3 shadow-xs">
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500 text-white">CAPACITY ALERT</span>
            <span>{sandbox_state['alert_notice']}</span>
        </div>
        """

    policy_html = ""
    if sandbox_state.get("policy_notice"):
        policy_html = f"""
        <div class="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-sm flex items-center gap-3 shadow-xs">
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500 text-white">LEGAL REVISION</span>
            <span>{sandbox_state['policy_notice']}</span>
        </div>
        """

    # Feature List
    features_html = "".join([
        f"""<li class="flex items-center gap-2.5 text-xs text-neutral-300 py-1.5 border-b border-neutral-800/60">
            <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            <span>{f}</span>
        </li>"""
        for f in sandbox_state["features"]
    ])

    # Theme Overhaul Styles
    is_v3 = sandbox_state.get("theme") == "redesign_v3"
    accent_gradient = "from-indigo-500 via-purple-500 to-pink-500" if is_v3 else "from-white via-neutral-200 to-neutral-400"
    hero_badge = "AI-Driven Cloud Fabric v3.0-PRO" if is_v3 else f"Release Status: {sandbox_state['version']}"

    html_content = f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{sandbox_state['site_title']} &bull; {sandbox_state['version']}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #09090b;
            color: #f4f4f5;
        }}
        .mono {{ font-family: 'JetBrains Mono', monospace; }}
    </style>
</head>
<body class="min-h-screen flex flex-col antialiased selection:bg-neutral-800 selection:text-white">

    <!-- ======================================================== -->
    <!-- INTERACTIVE DEMO CONTROL BAR (Sticky Top Simulation Deck) -->
    <!-- ======================================================== -->
    <header class="sticky top-0 z-50 bg-[#121215]/95 backdrop-blur-md border-b border-neutral-800 shadow-xl px-4 py-3">
        <div class="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2.5 flex-wrap">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="font-bold tracking-tight text-white mono uppercase">DEMO SIMULATION DECK</span>
                <span class="text-neutral-600">|</span>
                <span class="text-neutral-400 text-[11px]">
                    Target URL: <code id="target-url" class="bg-neutral-900 border border-neutral-700/80 px-2 py-0.5 rounded text-amber-300 font-mono">/demo-site</code>
                </span>
                <button onclick="copyTargetUrl()" class="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[10px] cursor-pointer transition">
                    Copy URL
                </button>
            </div>

            <!-- Simulation Triggers -->
            <div class="flex items-center gap-2 flex-wrap">
                <span class="text-neutral-500 text-[11px] font-medium mr-1">Simulate Mutation:</span>

                <button onclick="mutate('price_drop')" class="px-2.5 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition">
                    <span>💸 Price Drop ($49 → $19)</span>
                </button>

                <button onclick="mutate('stock_out')" class="px-2.5 py-1.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition">
                    <span>📦 Mark Sold Out</span>
                </button>

                <button onclick="mutate('policy_update')" class="px-2.5 py-1.5 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition">
                    <span>📜 Revise Terms & Privacy</span>
                </button>

                <button onclick="mutate('major_redesign')" class="px-2.5 py-1.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition">
                    <span>🎨 Major v3.0 Redesign</span>
                </button>

                <button onclick="mutate('reset')" class="px-2 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-medium text-xs cursor-pointer transition">
                    <span>🔄 Reset</span>
                </button>

                <a href="/" target="_blank" class="px-2.5 py-1.5 rounded-md bg-white hover:bg-neutral-200 text-neutral-950 font-semibold text-xs ml-1 flex items-center gap-1 transition">
                    <span>Open Dashboard</span>
                    <span>&nearr;</span>
                </a>
            </div>
        </div>
    </header>

    <!-- Toast Notification Banner (Shown after DOM mutation) -->
    <div id="toast-banner" class="hidden fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-neutral-900 border border-emerald-500/40 shadow-2xl text-xs text-neutral-200 space-y-1">
        <div class="flex items-center gap-2 text-emerald-400 font-bold">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span>DOM Mutated Successfully!</span>
        </div>
        <p class="text-neutral-400">
            Now switch to your Change Detector tab and click <strong>"Check Now"</strong> on this website to watch Playwright capture the visual diff and AI summary!
        </p>
    </div>

    <!-- Main SaaS Webpage -->
    <main class="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        {banner_html}
        {alert_html}
        {policy_html}

        <!-- Hero Section -->
        <section class="text-center space-y-5 py-8">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{hero_badge}</span>
            </div>

            <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b {accent_gradient} max-w-3xl mx-auto leading-tight">
                {sandbox_state['hero_headline']}
            </h1>

            <p class="text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                {sandbox_state['hero_subhead']}
            </p>

            <div class="pt-2">
                {stock_badge}
            </div>
        </section>

        <!-- Pricing Cards Grid -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
            <!-- Tier 1: Starter -->
            <div class="p-6 rounded-2xl bg-[#111114] border border-neutral-800 flex flex-col justify-between">
                <div class="space-y-4">
                    <div class="text-xs font-mono uppercase text-neutral-500 font-semibold tracking-wider">Hobby Starter</div>
                    <div class="text-3xl font-extrabold text-white">{sandbox_state['starter_price']} <span class="text-xs font-normal text-neutral-500">/mo</span></div>
                    <p class="text-xs text-neutral-400">Perfect for prototyping and personal background scripts.</p>
                    <ul class="space-y-1 pt-2">
                        <li class="text-xs text-neutral-300 py-1 flex items-center gap-2"><span class="text-emerald-400">✓</span> 3 Cloud instances</li>
                        <li class="text-xs text-neutral-300 py-1 flex items-center gap-2"><span class="text-emerald-400">✓</span> Community forum support</li>
                        <li class="text-xs text-neutral-300 py-1 flex items-center gap-2"><span class="text-emerald-400">✓</span> 1GB Edge storage</li>
                    </ul>
                </div>
                <button class="mt-6 w-full py-2.5 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition">
                    Get Started Free
                </button>
            </div>

            <!-- Tier 2: Developer Pro (Highlighted) -->
            <div class="p-6 rounded-2xl bg-[#14151b] border-2 border-emerald-500/50 shadow-xl flex flex-col justify-between relative">
                <div class="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-emerald-500 text-neutral-950 font-bold text-[10px] uppercase tracking-wider">
                    Most Popular
                </div>

                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider">Developer Pro</span>
                        {price_badge}
                    </div>
                    <div class="flex items-baseline gap-1">
                        <span class="text-4xl font-extrabold text-white">{sandbox_state['pro_price']}</span>
                        <span class="text-xs font-normal text-neutral-400">/ month</span>
                    </div>
                    <p class="text-xs text-neutral-400">High-throughput automated cluster with continuous health monitoring.</p>
                    <div class="space-y-1 pt-2">
                        <div class="text-[11px] font-bold uppercase tracking-wider text-neutral-400 pb-1">Included Capabilities:</div>
                        <ul class="space-y-0.5">
                            {features_html}
                        </ul>
                    </div>
                </div>

                <div class="mt-6">
                    {cta_button}
                </div>
            </div>

            <!-- Tier 3: Enterprise -->
            <div class="p-6 rounded-2xl bg-[#111114] border border-neutral-800 flex flex-col justify-between">
                <div class="space-y-4">
                    <div class="text-xs font-mono uppercase text-neutral-500 font-semibold tracking-wider">Enterprise Scale</div>
                    <div class="text-3xl font-extrabold text-white">{sandbox_state['enterprise_price']} <span class="text-xs font-normal text-neutral-500">/mo</span></div>
                    <p class="text-xs text-neutral-400">Dedicated private cloud nodes with custom SLA & 24/7 SRE support.</p>
                    <ul class="space-y-1 pt-2">
                        <li class="text-xs text-neutral-300 py-1 flex items-center gap-2"><span class="text-emerald-400">✓</span> Unlimited cluster worker nodes</li>
                        <li class="text-xs text-neutral-300 py-1 flex items-center gap-2"><span class="text-emerald-400">✓</span> Dedicated VPC peering</li>
                        <li class="text-xs text-neutral-300 py-1 flex items-center gap-2"><span class="text-emerald-400">✓</span> 99.99% Guaranteed uptime SLA</li>
                        <li class="text-xs text-neutral-300 py-1 flex items-center gap-2"><span class="text-emerald-400">✓</span> SOC2 & HIPAA Compliance ready</li>
                    </ul>
                </div>
                <button class="mt-6 w-full py-2.5 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition">
                    Contact Enterprise Sales
                </button>
            </div>
        </section>

        <!-- Technical Telemetry Footer Info -->
        <footer class="mt-20 pt-8 border-t border-neutral-800/80 text-center text-xs text-neutral-500 font-mono space-y-2">
            <div>DOM Snapshot Generation: <span class="text-neutral-400">{sandbox_state['last_mutated_at']}</span> &bull; Status: <span class="text-emerald-400">LIVE TARGET</span></div>
            <div>ApexCloud Platform Inc. &bull; Terms of Service &bull; Privacy Disclosures</div>
        </footer>
    </main>

    <script>
        // Update Target URL with current host
        document.getElementById('target-url').textContent = window.location.origin + '/demo-site';

        function copyTargetUrl() {{
            const url = window.location.origin + '/demo-site';
            navigator.clipboard.writeText(url);
            showToast('Target URL copied to clipboard: ' + url);
        }}

        function showToast(msg) {{
            const toast = document.getElementById('toast-banner');
            if (msg) toast.querySelector('p').textContent = msg;
            toast.classList.remove('hidden');
            setTimeout(() => {{
                toast.classList.add('hidden');
            }}, 6000);
        }}

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

        // Check if just mutated
        if (sessionStorage.getItem('just_mutated') === 'true') {{
            sessionStorage.removeItem('just_mutated');
            showToast();
        }}
    </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content, status_code=200)


@router.post("/mutate")
async def mutate_demo_site(body: MutateRequest):
    """
    Executes an instant DOM mutation on the demo site.
    """
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    sandbox_state["last_mutated_at"] = now_str

    if body.action == "price_drop":
        sandbox_state["pro_price"] = "$19"
        sandbox_state["pro_discount_badge"] = "FLASH SALE: 60% OFF"
        sandbox_state["banner_notice"] = "Special Promotion Active: Developer Pro cluster dropped from $49 to $19/month!"
    elif body.action == "stock_out":
        sandbox_state["stock_status"] = "sold_out"
        sandbox_state["alert_notice"] = "Regional Capacity Alert: All 14 dedicated clusters in us-east-1 are currently allocated. Orders paused."
    elif body.action == "policy_update":
        sandbox_state["policy_notice"] = "Mandatory Legal Update: Section 4.2 of Data Retention & Privacy Policy revised to comply with European EU-US Data Privacy Framework."
        if "EU-US Data Privacy Framework Compliance Audit" not in sandbox_state["features"]:
            sandbox_state["features"].append("EU-US Data Privacy Framework Compliance Audit")
    elif body.action == "major_redesign":
        sandbox_state["theme"] = "redesign_v3"
        sandbox_state["site_title"] = "ApexCloud AI Next-Gen &bull; Intelligent Compute Fabric"
        sandbox_state["version"] = "v3.0.0-AI"
        sandbox_state["hero_headline"] = "Intelligent AI-first compute fabric for global scale."
        sandbox_state["hero_subhead"] = "Next-generation autonomous edge clusters powered by real-time neural load prediction, distributed vector storage, and zero-latency routing."
        sandbox_state["features"] = [
            "Autonomous AI neural load prediction",
            "Distributed real-time vector caching",
            "Zero-latency multi-region edge mesh",
            "Automated root-cause APM telemetry",
        ]
        sandbox_state["banner_notice"] = "Announcing ApexCloud v3.0: Full integration with generative vector workloads!"
    elif body.action == "reset":
        sandbox_state.clear()
        sandbox_state.update(DEFAULT_STATE)
        sandbox_state["features"] = [
            "Automated continuous delivery pipelines",
            "Multi-region failover orchestration",
            "Sub-millisecond edge caching layer",
            "Real-time distributed tracing & APM",
            "Role-based access control (RBAC)",
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
        "Multi-region failover orchestration",
        "Sub-millisecond edge caching layer",
        "Real-time distributed tracing & APM",
        "Role-based access control (RBAC)",
    ]
    sandbox_state["last_mutated_at"] = now_str
    return {"success": True, "state": sandbox_state}

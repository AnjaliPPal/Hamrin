import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * GET /api/wall/snippet.js?installation_id=X
 *
 * Embeddable JS for Failed Payment Wall + Pause Wall.
 * Payment wall takes priority over pause wall.
 *
 * Usage: Add to page and a container with customer email:
 *   <script src="https://app.hamrin.ai/api/wall/snippet.js?installation_id=YOUR_ID"></script>
 *   <div id="lamrin-wall-root" data-lamrin-wall data-customer-email="user@example.com"></div>
 *
 * Optional: data-mode="banner" | "modal" | "blocking" (default: modal)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const installationId = searchParams.get("installation_id");

  if (!installationId) {
    return new NextResponse("// Error: installation_id is required", {
      status: 400,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  const js = `
(function() {
  'use strict';

  var INSTALLATION_ID = ${JSON.stringify(installationId)};
  var API_BASE = ${JSON.stringify(appUrl)};

  function getContainer() {
    var el = document.querySelector('[data-lamrin-wall]');
    if (!el) el = document.body;
    return el;
  }

  function getEmail() {
    var el = document.querySelector('[data-lamrin-wall]');
    return el ? (el.getAttribute('data-customer-email') || '').trim() : '';
  }

  function getMode() {
    var el = document.querySelector('[data-lamrin-wall]');
    var mode = (el && el.getAttribute('data-mode')) || 'modal';
    return mode === 'banner' || mode === 'blocking' ? mode : 'modal';
  }

  function wallCheck() {
    var email = getEmail();
    if (!email) return Promise.resolve({ hasOpenFailedPayments: false, invoices: [] });
    return fetch(API_BASE + '/api/wall/check?customer_email=' + encodeURIComponent(email) + '&installation_id=' + encodeURIComponent(INSTALLATION_ID))
      .then(function(r) { return r.json(); })
      .catch(function() { return { hasOpenFailedPayments: false, invoices: [] }; });
  }

  function pauseCheck() {
    var email = getEmail();
    if (!email) return Promise.resolve({ isPaused: false });
    return fetch(API_BASE + '/api/wall/pause-check?customer_email=' + encodeURIComponent(email) + '&installation_id=' + encodeURIComponent(INSTALLATION_ID))
      .then(function(r) { return r.json(); })
      .catch(function() { return { isPaused: false }; });
  }

  function resumeSubscription(subscriptionId) {
    return fetch(API_BASE + '/api/wall/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installation_id: INSTALLATION_ID, subscription_id: subscriptionId })
    }).then(function(r) { return r.json(); });
  }

  function injectStyles() {
    if (document.getElementById('lamrin-wall-styles')) return;
    var s = document.createElement('style');
    s.id = 'lamrin-wall-styles';
    s.textContent = [
      '#lamrin-wall-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99998;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
      '#lamrin-wall-banner{position:fixed;top:0;left:0;right:0;z-index:99998;background:#2563eb;color:#fff;padding:14px 24px;font-size:15px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;box-shadow:0 4px 12px rgba(0,0,0,.15)}',
      '#lamrin-wall-box{background:#fff;border-radius:12px;padding:28px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.2)}',
      '#lamrin-wall-box h2{margin:0 0 10px;font-size:20px;font-weight:700;color:#111}',
      '#lamrin-wall-box p{margin:0 0 18px;color:#444;font-size:15px;line-height:1.5}',
      '.lamrin-wall-btn{display:inline-block;padding:11px 22px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;border:none;text-decoration:none;transition:opacity .15s}',
      '.lamrin-wall-btn:hover{opacity:.9}',
      '.lamrin-wall-btn-primary{background:#2563eb;color:#fff}',
      '.lamrin-wall-btn-ghost{background:transparent;color:#666;border:1px solid #ddd}'
    ].join('');
    document.head.appendChild(s);
  }

  function removeWall() {
    var o = document.getElementById('lamrin-wall-overlay');
    var b = document.getElementById('lamrin-wall-banner');
    if (o) o.remove();
    if (b) b.remove();
  }

  function showPaymentWall(invoices) {
    injectStyles();
    var recoverUrl = invoices.length ? (API_BASE + '/recover?invoice_id=' + encodeURIComponent(invoices[0].invoiceId)) : API_BASE + '/recover';
    var mode = getMode();

    if (mode === 'banner') {
      var banner = document.createElement('div');
      banner.id = 'lamrin-wall-banner';
      banner.innerHTML = '<span>Your payment failed. Please <a href="' + recoverUrl + '" style="color:#fff;text-decoration:underline;font-weight:600">update your payment method</a> to continue.</span><a href="' + recoverUrl + '" class="lamrin-wall-btn lamrin-wall-btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.7)">Update now</a>';
      document.body.appendChild(banner);
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'lamrin-wall-overlay';
    var box = document.createElement('div');
    box.id = 'lamrin-wall-box';
    box.innerHTML = '<h2>Payment update required</h2><p>We couldn\'t charge your payment method. Please update it to avoid any interruption.</p><a href="' + recoverUrl + '" class="lamrin-wall-btn lamrin-wall-btn-primary">Update payment method</a>';
    overlay.appendChild(box);
    if (mode === 'modal') {
      overlay.onclick = function(e) { if (e.target === overlay) removeWall(); };
    }
    document.body.appendChild(overlay);
  }

  function showPauseWall(resumeDate, subscriptionId) {
    injectStyles();
    var dateStr = resumeDate ? new Date(resumeDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'soon';
    var mode = getMode();

    if (mode === 'banner') {
      var banner = document.createElement('div');
      banner.id = 'lamrin-wall-banner';
      banner.innerHTML = '<span>Your subscription is paused until ' + dateStr + '.</span><button type="button" class="lamrin-wall-btn lamrin-wall-btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.7)" id="lamrin-wall-resume-btn">Resume now</button>';
      document.body.appendChild(banner);
      document.getElementById('lamrin-wall-resume-btn').onclick = function() {
        resumeSubscription(subscriptionId).then(function() { removeWall(); location.reload(); }).catch(function() {});
      };
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'lamrin-wall-overlay';
    var box = document.createElement('div');
    box.id = 'lamrin-wall-box';
    box.innerHTML = '<h2>Subscription paused</h2><p>Your subscription is paused until ' + dateStr + '. Resume anytime to continue.</p><button type="button" class="lamrin-wall-btn lamrin-wall-btn-primary" id="lamrin-wall-resume-btn">Resume now</button>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.getElementById('lamrin-wall-resume-btn').onclick = function() {
      resumeSubscription(subscriptionId).then(function() { removeWall(); location.reload(); }).catch(function() {});
    };
    if (mode === 'modal') {
      overlay.onclick = function(e) { if (e.target === overlay) removeWall(); };
    }
  }

  function run() {
    var email = getEmail();
    if (!email) return;

    wallCheck().then(function(data) {
      if (data.hasOpenFailedPayments && data.invoices && data.invoices.length) {
        showPaymentWall(data.invoices);
        return;
      }
      return pauseCheck().then(function(pause) {
        if (pause.isPaused && pause.subscriptionId) {
          showPauseWall(pause.resumeDate, pause.subscriptionId);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
`.trim();

  return new NextResponse(js, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}

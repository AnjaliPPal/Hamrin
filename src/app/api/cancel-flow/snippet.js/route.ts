import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const runtime = "edge";

/**
 * GET /api/cancel-flow/snippet.js?installation_id=X
 *
 * Returns a self-contained JS widget that merchants embed with a single script tag:
 *   <script src="https://app.lamrin.ai/api/cancel-flow/snippet.js?installation_id=YOUR_ID"></script>
 *
 * Usage in merchant's app:
 *   Add data-lamrin-cancel to the cancel button element:
 *   <button data-lamrin-cancel
 *           data-customer-id="cus_xxx"
 *           data-subscription-id="sub_xxx">Cancel subscription</button>
 *
 * The script intercepts the click, opens the retention modal, and only proceeds
 * with the original action if the customer declines all offers.
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

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const js = `
(function() {
  'use strict';

  var INSTALLATION_ID = ${JSON.stringify(installationId)};
  var API_BASE = ${JSON.stringify(appUrl)};

  var config = null;
  var sessionId = null;

  function fetchConfig() {
    return fetch(API_BASE + '/api/cancel-flow/config?installation_id=' + INSTALLATION_ID)
      .then(function(r) { return r.json(); })
      .catch(function() { return null; });
  }

  function createSession(customerId, subscriptionId) {
    return fetch(API_BASE + '/api/cancel-flow/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        installationId: INSTALLATION_ID,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId
      })
    }).then(function(r) { return r.json(); });
  }

  function saveSession(sid, reason, reasonText, offerType, extras) {
    return fetch(API_BASE + '/api/cancel-flow/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ sessionId: sid, reason: reason, reasonText: reasonText, offerType: offerType }, extras))
    }).then(function(r) { return r.json(); });
  }

  function cancelSession(sid, reason, reasonText, extras) {
    return fetch(API_BASE + '/api/cancel-flow/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ sessionId: sid, reason: reason, reasonText: reasonText }, extras))
    }).then(function(r) { return r.json(); });
  }

  // ── Styles ─────────────────────────────────────────────────────────────
  function injectStyles(brandColor) {
    if (document.getElementById('lamrin-cf-styles')) return;
    var s = document.createElement('style');
    s.id = 'lamrin-cf-styles';
    s.textContent = [
      '#lamrin-cf-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
      '#lamrin-cf-modal{background:#fff;border-radius:12px;padding:32px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.2);animation:lamrin-slide-in .2s ease}',
      '@keyframes lamrin-slide-in{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}',
      '#lamrin-cf-modal h2{margin:0 0 8px;font-size:22px;font-weight:700;color:#111}',
      '#lamrin-cf-modal p{margin:0 0 20px;color:#555;font-size:15px;line-height:1.5}',
      '#lamrin-cf-modal select,#lamrin-cf-modal textarea{width:100%;padding:10px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:12px;box-sizing:border-box;outline:none;transition:border .2s}',
      '#lamrin-cf-modal select:focus,#lamrin-cf-modal textarea:focus{border-color:' + brandColor + '}',
      '#lamrin-cf-modal textarea{resize:vertical;min-height:72px}',
      '.lamrin-cf-btn{display:inline-flex;align-items:center;justify-content:center;padding:11px 22px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;border:none;transition:opacity .15s}',
      '.lamrin-cf-btn:hover{opacity:.88}',
      '.lamrin-cf-btn-primary{background:' + brandColor + ';color:#fff;width:100%;margin-bottom:10px}',
      '.lamrin-cf-btn-ghost{background:transparent;color:#888;font-size:14px;font-weight:400;padding:6px 0;text-decoration:underline;width:100%;text-align:center}',
      '.lamrin-cf-offer-box{background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;padding:18px;margin-bottom:16px}',
      '.lamrin-cf-offer-box h3{margin:0 0 6px;font-size:17px;font-weight:700;color:#111}',
      '.lamrin-cf-offer-box p{margin:0;color:#444;font-size:14px}'
    ].join('');
    document.head.appendChild(s);
  }

  // ── Modal builder ───────────────────────────────────────────────────────
  function removeModal() {
    var el = document.getElementById('lamrin-cf-overlay');
    if (el) el.remove();
  }

  function showStep1(cfg, originalAction) {
    removeModal();
    injectStyles(cfg.brandColor);

    var reasons = cfg.reasonOptions || [];
    var optionsHtml = reasons.map(function(r) {
      return '<option value="' + r + '">' + r + '</option>';
    }).join('');

    var html = [
      '<div id="lamrin-cf-overlay">',
      '<div id="lamrin-cf-modal">',
      cfg.brandLogo ? '<img src="' + cfg.brandLogo + '" style="height:36px;margin-bottom:16px;" alt="logo">' : '',
      '<h2>Before you go...</h2>',
      '<p>We\'d love to keep you. Could you tell us why you\'re leaving?</p>',
      '<select id="lamrin-cf-reason"><option value="">Select a reason...</option>' + optionsHtml + '</select>',
      '<textarea id="lamrin-cf-reason-text" placeholder="Any additional details? (optional)"></textarea>',
      '<button class="lamrin-cf-btn lamrin-cf-btn-primary" id="lamrin-cf-next">Continue</button>',
      '<button class="lamrin-cf-btn lamrin-cf-btn-ghost" id="lamrin-cf-skip">Skip and cancel anyway</button>',
      '</div></div>'
    ].join('');

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);

    document.getElementById('lamrin-cf-next').onclick = function() {
      var reason = document.getElementById('lamrin-cf-reason').value;
      if (!reason) { alert('Please select a reason.'); return; }
      var reasonText = document.getElementById('lamrin-cf-reason-text').value;
      showStep2(cfg, reason, reasonText, originalAction);
    };

    document.getElementById('lamrin-cf-skip').onclick = function() {
      if (sessionId) {
        cancelSession(sessionId, 'skipped', '', {}).catch(function() {});
      }
      removeModal();
      if (typeof originalAction === 'function') originalAction();
    };
  }

  function getOfferForReason(cfg, reason) {
    var offers = cfg.offers || [];
    if (!offers.length) return null;
    var lowerReason = reason.toLowerCase();
    if (lowerReason.indexOf('expensive') !== -1 || lowerReason.indexOf('price') !== -1) {
      return offers.find(function(o) { return o.type === 'discount'; }) || offers[0];
    }
    if (lowerReason.indexOf('not using') !== -1 || lowerReason.indexOf('pause') !== -1) {
      return offers.find(function(o) { return o.type === 'pause'; }) || offers[0];
    }
    return offers[0];
  }

  function offerLabel(offer) {
    if (!offer) return '';
    if (offer.type === 'discount') {
      return offer.discountPercent + '% off for ' + (offer.discountMonths || 3) + ' months';
    }
    if (offer.type === 'pause') {
      return 'Pause for ' + (offer.pauseMonths || 1) + ' month' + (offer.pauseMonths > 1 ? 's' : '');
    }
    return '';
  }

  function showStep2(cfg, reason, reasonText, originalAction) {
    removeModal();
    injectStyles(cfg.brandColor);

    var offer = getOfferForReason(cfg, reason);

    var offerHtml = '';
    if (offer) {
      var label = offerLabel(offer);
      var desc = offer.type === 'discount'
        ? 'Stay and save — we\'ll apply ' + label + ' automatically, no code needed.'
        : 'Not ready to commit right now? We\'ll pause your account and nothing will be charged.';
      offerHtml = [
        '<div class="lamrin-cf-offer-box">',
        '<h3>Special offer: ' + label + '</h3>',
        '<p>' + desc + '</p>',
        '</div>',
        '<button class="lamrin-cf-btn lamrin-cf-btn-primary" id="lamrin-cf-accept">Accept offer</button>'
      ].join('');
    }

    var extraField = '';
    if (reason === 'Switching to competitor') {
      extraField = '<input type="text" id="lamrin-cf-competitor" placeholder="Which tool are you switching to?" style="width:100%;padding:10px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:12px;box-sizing:border-box;">';
    }

    var html = [
      '<div id="lamrin-cf-overlay">',
      '<div id="lamrin-cf-modal">',
      '<h2>We hear you.</h2>',
      '<p>Here\'s what we can do for you right now:</p>',
      offerHtml,
      extraField,
      '<button class="lamrin-cf-btn lamrin-cf-btn-ghost" id="lamrin-cf-confirm-cancel">No thanks, cancel my subscription</button>',
      '</div></div>'
    ].join('');

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);

    if (offer && document.getElementById('lamrin-cf-accept')) {
      document.getElementById('lamrin-cf-accept').onclick = function() {
        if (!sessionId) return;
        saveSession(sessionId, reason, reasonText, offer.type, {
          feedbackText: '',
          competitorName: document.getElementById('lamrin-cf-competitor') ? document.getElementById('lamrin-cf-competitor').value : ''
        }).then(function() {
          removeModal();
          showConfirmation(cfg, offer);
        }).catch(function() { removeModal(); });
      };
    }

    document.getElementById('lamrin-cf-confirm-cancel').onclick = function() {
      var competitor = document.getElementById('lamrin-cf-competitor') ? document.getElementById('lamrin-cf-competitor').value : '';
      if (sessionId) {
        cancelSession(sessionId, reason, reasonText, { competitorName: competitor })
          .catch(function() {});
      }
      removeModal();
      if (typeof originalAction === 'function') originalAction();
    };
  }

  function showConfirmation(cfg, offer) {
    injectStyles(cfg.brandColor);
    var label = offerLabel(offer);
    var html = [
      '<div id="lamrin-cf-overlay">',
      '<div id="lamrin-cf-modal" style="text-align:center">',
      '<div style="font-size:48px;margin-bottom:12px">🎉</div>',
      '<h2>You\'re all set!</h2>',
      '<p>Your offer (<strong>' + label + '</strong>) has been applied. Thank you for staying with us.</p>',
      '<button class="lamrin-cf-btn lamrin-cf-btn-primary" id="lamrin-cf-done">Close</button>',
      '</div></div>'
    ].join('');
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
    document.getElementById('lamrin-cf-done').onclick = removeModal;
  }

  // ── Main intercept logic ───────────────────────────────────────────────
  function interceptButton(btn) {
    if (btn.dataset.lamrinBound) return;
    btn.dataset.lamrinBound = '1';

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      var customerId = btn.dataset.customerId || btn.getAttribute('data-customer-id');
      var subscriptionId = btn.dataset.subscriptionId || btn.getAttribute('data-subscription-id');

      if (!customerId || !subscriptionId) {
        console.warn('[lamrin] Missing data-customer-id or data-subscription-id on button');
        return;
      }

      var originalAction = function() {
        btn.removeEventListener('click', arguments.callee);
        btn.click();
      };

      // Create session, then show step 1
      createSession(customerId, subscriptionId).then(function(res) {
        if (res.disabled) {
          // Cancel flow disabled for this installation
          if (typeof originalAction === 'function') originalAction();
          return;
        }
        sessionId = res.sessionId;
        var cfg = res.config;
        cfg.brandColor = cfg.brandColor || '#2563eb';
        fetchConfig().then(function(c) {
          if (c && !c.disabled) {
            cfg.brandColor = c.brandColor || cfg.brandColor;
            cfg.brandLogo = c.brandLogo || cfg.brandLogo;
          }
          showStep1(cfg, originalAction);
        }).catch(function() {
          showStep1(cfg, originalAction);
        });
      }).catch(function(err) {
        console.error('[lamrin] Failed to create session', err);
        // On error, don't block the user — allow original action
        if (typeof originalAction === 'function') originalAction();
      });
    }, true);
  }

  function bindAll() {
    var btns = document.querySelectorAll('[data-lamrin-cancel]');
    btns.forEach(interceptButton);
  }

  // Bind on DOM ready + observe for dynamic buttons
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAll);
  } else {
    bindAll();
  }

  var obs = new MutationObserver(function() { bindAll(); });
  obs.observe(document.body, { childList: true, subtree: true });

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

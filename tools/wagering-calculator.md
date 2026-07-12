---
layout: "base.njk"
lang: "bn-BD"
title: "Wagering Calculator: বোনাস টার্নওভার হিসাব করুন"
description: "বোনাসের wagering/turnover requirement কত টাকা bet করলে পূরণ হবে — deposit, bonus %, multiplier ও game contribution দিয়ে এক ক্লিকে হিসাব করুন। ফ্রি টুল।"
date: 2026-07-13
lastUpdated: 2026-07-13
tags: "landing"
ogImage: "betting-odds-explained-hero-optimized.webp"
ogImageAlt: "Wagering requirement turnover calculator for bonus terms"
faq:
  - question: "Wagering requirement মানে কী?"
    answer: "বোনাসের টাকা withdraw করার আগে যত টাকার bet করতে হবে, সেটাই wagering বা turnover requirement। যেমন ৳৫০০ বোনাসে 10x wagering মানে মোট ৳৫,০০০ bet করতে হবে।"
  - question: "Wagering কি বোনাসের উপর নাকি deposit+bonus-এর উপর হিসাব হয়?"
    answer: "দুই রকমই হয় — এটা নির্ভর করে অফারের শর্তে কী লেখা আছে তার উপর। 'bonus only' হলে শুধু বোনাস × multiplier; 'deposit + bonus' হলে দুটোর যোগফল × multiplier। Terms-এ কোনটা লেখা তা অবশ্যই দেখে নিন।"
  - question: "Game contribution কী?"
    answer: "সব গেমের bet সমানভাবে wagering-এ গণনা হয় না। Slot সাধারণত ১০০% গণনা হলেও live casino বা table game অনেক সময় ১০-৫০% গণনা হয়। Contribution কম হলে বাস্তবে আরও বেশি টাকার bet করতে হয়।"
  - question: "10x আর 30x wagering-এর মধ্যে পার্থক্য কত বড়?"
    answer: "৳১,০০০ বোনাসে 10x মানে ৳১০,০০০ bet; 30x মানে ৳৩০,০০০ bet — তিন গুণ। Multiplier যত কম, বোনাস cash করা তত সহজ। অফার নেওয়ার আগে multiplier দেখাই সবচেয়ে জরুরি।"
  - question: "এই ক্যালকুলেটরের হিসাব কি সব সাইটে খাটবে?"
    answer: "গাণিতিক সূত্র সব জায়গায় একই, কিন্তু প্রতিটি অফারের নিজস্ব শর্ত থাকে (মেয়াদ, সর্বোচ্চ bet, eligible game)। হিসাবটা গাইড হিসেবে নিন এবং অফিসিয়াল bonus terms অবশ্যই পড়ুন।"
---

<main class="wrap">
  <section class="hero" id="hero">
    <div class="badge">
      <span class="kicker">Bangladesh • Free Tool</span>
      <span>Last updated: <span class="last-updated">{{ lastUpdated | date("MMMM dd, yyyy") }}</span></span>
    </div>
    <h1 class="h1">Wagering / Turnover ক্যালকুলেটর — বোনাস তুলতে কত bet লাগবে?</h1>
    <p class="lead">বোনাস নেওয়ার আগে জেনে নিন সেটা cash করতে আসলে কত টাকার bet করতে হবে। Deposit, bonus, multiplier আর game contribution দিলেই হিসাব রেডি।</p>
  </section>

  <section class="card" aria-labelledby="calc-heading">
    <h2 id="calc-heading">ক্যালকুলেটর</h2>
    <div style="display: grid; gap: 14px; max-width: 560px;">
      <label>Wagering কীসের উপর?
        <select id="wc-basis" style="width: 100%; padding: 10px; margin-top: 6px; background: #0b1420; color: var(--text); border: 1px solid #243041; border-radius: 10px;">
          <option value="bonus">শুধু Bonus-এর উপর</option>
          <option value="depbonus">Deposit + Bonus-এর উপর</option>
        </select>
      </label>
      <label id="wc-dep-label" style="display: none;">Deposit (৳)
        <input id="wc-deposit" type="number" min="0" step="1" value="1000" inputmode="numeric" style="width: 100%; padding: 10px; margin-top: 6px; background: #0b1420; color: var(--text); border: 1px solid #243041; border-radius: 10px;">
      </label>
      <label>Bonus (৳)
        <input id="wc-bonus" type="number" min="0" step="1" value="500" inputmode="numeric" style="width: 100%; padding: 10px; margin-top: 6px; background: #0b1420; color: var(--text); border: 1px solid #243041; border-radius: 10px;">
      </label>
      <label>Wagering multiplier (যেমন 10x হলে 10)
        <input id="wc-mult" type="number" min="1" step="0.5" value="10" inputmode="numeric" style="width: 100%; padding: 10px; margin-top: 6px; background: #0b1420; color: var(--text); border: 1px solid #243041; border-radius: 10px;">
      </label>
      <label>Game contribution % (slot সাধারণত 100)
        <input id="wc-contrib" type="number" min="1" max="100" step="1" value="100" inputmode="numeric" style="width: 100%; padding: 10px; margin-top: 6px; background: #0b1420; color: var(--text); border: 1px solid #243041; border-radius: 10px;">
      </label>
      <label>গড় bet size (৳, ঐচ্ছিক)
        <input id="wc-bet" type="number" min="0" step="1" value="" placeholder="যেমন 50" inputmode="numeric" style="width: 100%; padding: 10px; margin-top: 6px; background: #0b1420; color: var(--text); border: 1px solid #243041; border-radius: 10px;">
      </label>
      <div id="wc-result" style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); border: 1px solid #10b981; border-radius: 12px; padding: 18px; font-size: 1.05rem; line-height: 1.7;"></div>
    </div>
    <script>
      (function(){
        var basis = document.getElementById('wc-basis'),
            depLabel = document.getElementById('wc-dep-label'),
            dep = document.getElementById('wc-deposit'),
            bonus = document.getElementById('wc-bonus'),
            mult = document.getElementById('wc-mult'),
            contrib = document.getElementById('wc-contrib'),
            bet = document.getElementById('wc-bet'),
            result = document.getElementById('wc-result');
        function fmt(n){ return '৳' + Math.round(n).toLocaleString('en-US'); }
        function calc(){
          var b = parseFloat(bonus.value) || 0,
              d = parseFloat(dep.value) || 0,
              m = parseFloat(mult.value) || 0,
              c = Math.min(Math.max(parseFloat(contrib.value) || 100, 1), 100),
              avg = parseFloat(bet.value) || 0;
          var base = basis.value === 'depbonus' ? d + b : b;
          if (base <= 0 || m <= 0) { result.innerHTML = 'Bonus ও multiplier দিন।'; return; }
          var turnover = base * m;
          var effective = turnover / (c / 100);
          var html = 'Wagering base: <strong>' + fmt(base) + '</strong> × ' + m + 'x<br>' +
                     'প্রয়োজনীয় turnover: <strong>' + fmt(turnover) + '</strong>';
          if (c < 100) html += '<br>' + c + '% contribution-এ বাস্তবে bet করতে হবে: <strong>' + fmt(effective) + '</strong>';
          if (avg > 0) html += '<br>গড়ে ' + fmt(avg) + ' bet ধরলে আনুমানিক <strong>' + Math.ceil(effective / avg).toLocaleString('en-US') + 'টি bet</strong>';
          result.innerHTML = html;
        }
        basis.addEventListener('change', function(){ depLabel.style.display = basis.value === 'depbonus' ? 'block' : 'none'; calc(); });
        [dep, bonus, mult, contrib, bet].forEach(function(el){ el.addEventListener('input', calc); });
        calc();
      })();
    </script>
  </section>

  <section class="card" aria-labelledby="example-heading">
    <h2 id="example-heading">উদাহরণ (সাধারণ অফার রেঞ্জ)</h2>
    <div style="overflow-x: auto;">
      <table>
        <thead>
          <tr><th>Bonus</th><th>Wagering</th><th>প্রয়োজনীয় turnover</th></tr>
        </thead>
        <tbody>
          <tr><td>৳৫০০</td><td>10x (bonus)</td><td>৳৫,০০০</td></tr>
          <tr><td>৳১,০০০</td><td>20x (bonus)</td><td>৳২০,০০০</td></tr>
          <tr><td>৳১,০০০</td><td>30x (bonus)</td><td>৳৩০,০০০</td></tr>
          <tr><td>৳১,০০০ (+৳১,০০০ deposit)</td><td>10x (dep+bonus)</td><td>৳২০,০০০</td></tr>
        </tbody>
      </table>
    </div>
    <p class="note">উদাহরণগুলো illustrative — প্রতিটি অফারের নিজস্ব multiplier, মেয়াদ, সর্বোচ্চ bet ও eligible game শর্ত থাকে। অফার নেওয়ার আগে অফিসিয়াল terms পড়ুন। বাজেট ঠিক করে খেলুন — <a href="/responsible-gaming/">Responsible Gaming</a>।</p>
  </section>

  <section class="card" aria-labelledby="faq-heading">
    <h2 id="faq-heading">সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)</h2>
    {% for item in faq %}
    <details style="background: rgba(255,255,255,0.03); border: 1px solid #243041; border-radius: 12px; margin-bottom: 12px; padding: 4px 16px;">
      <summary style="cursor: pointer; font-weight: 600; padding: 12px 0;">{{ item.question }}</summary>
      <p style="color: var(--muted);">{{ item.answer }}</p>
    </details>
    {% endfor %}
  </section>

  <section class="card">
    <h2>আরও দরকারি গাইড ও টুল</h2>
    <ul>
      <li><a href="/tools/cash-out-charge-calculator/">bKash/Nagad Cash Out চার্জ ক্যালকুলেটর</a></li>
      <li><a href="/blog/borojeet-welcome-bonus-terms-bangla-2026/">Welcome bonus-এর শর্ত বিস্তারিত ব্যাখ্যা</a></li>
      <li><a href="/promotions/">চলমান প্রোমোশন ও বোনাস</a></li>
      <li><a href="/borojeet-bkash-deposit/">bKash দিয়ে deposit করার গাইড</a></li>
    </ul>
  </section>
</main>

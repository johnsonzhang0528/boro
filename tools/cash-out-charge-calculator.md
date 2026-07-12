---
layout: "base.njk"
lang: "bn-BD"
title: "bKash Nagad Cash Out চার্জ ক্যালকুলেটর ২০২৬"
description: "bKash ও Nagad cash out charge হিসাব করুন এক ক্লিকে — এজেন্ট, প্রিয় এজেন্ট, ATM ও *167# রেট (২০২৬ যাচাইকৃত)। কত টাকা কাটবে, হাতে কত পাবেন দেখুন।"
date: 2026-07-13
lastUpdated: 2026-07-13
tags: "landing"
ogImage: "og-bkash-cash-out-fee-calculator-guide-optimized.webp"
ogImageAlt: "bKash Nagad cash out charge calculator 2026 Bangladesh"
faq:
  - question: "bKash cash out charge ২০২৬ সালে কত?"
    answer: "সাধারণ এজেন্টে (অ্যাপ বা *247#) প্রতি হাজারে ৳১৮.৫০ (১.৮৫%)। প্রিয় এজেন্ট ও ATM-এ প্রতি হাজারে ৳১৪.৯০ (১.৪৯%)। প্রিয় এজেন্ট রেট মাসিক নির্দিষ্ট লিমিট পর্যন্ত প্রযোজ্য।"
  - question: "Nagad cash out charge কত?"
    answer: "Nagad অ্যাপ দিয়ে প্রতি হাজারে ৳১২.৫০ (১.২৫%), আর *167# ডায়াল করলে প্রতি হাজারে ৳১৫.০০ (১.৫০%)। প্রকাশিত চার্জ VAT-সহ। Islamic account-এও একই রেট।"
  - question: "bKash নাকি Nagad — cash out-এ কোনটা সাশ্রয়ী?"
    answer: "Nagad অ্যাপ (৳১২.৫০/হাজার) বর্তমানে সবচেয়ে কম। bKash-এ প্রিয় এজেন্ট বা ATM ব্যবহার করলে ৳১৪.৯০/হাজার — সাধারণ এজেন্টের চেয়ে হাজারে ৳৩.৬০ সাশ্রয়।"
  - question: "১০,০০০ টাকা cash out করলে কত চার্জ কাটবে?"
    answer: "bKash সাধারণ এজেন্টে ৳১৮৫, bKash প্রিয় এজেন্ট/ATM-এ ৳১৪৯, Nagad অ্যাপে ৳১২৫, Nagad *167#-এ ৳১৫০। উপরের ক্যালকুলেটরে যেকোনো amount দিয়ে হিসাব করুন।"
  - question: "এই রেট কি সবসময় ঠিক থাকবে?"
    answer: "রেট অপারেটর যেকোনো সময় পরিবর্তন করতে পারে। এই পেজের ডেটা ১৩ জুলাই ২০২৬-এ একাধিক সূত্রে যাচাই করা — বড় লেনদেনের আগে অবশ্যই নিজের অ্যাপে চার্জ confirm করুন।"
---

<main class="wrap">
  <section class="hero" id="hero">
    <div class="badge">
      <span class="kicker">Bangladesh • Free Tool</span>
      <span>রেট যাচাই: <span class="last-updated">{{ lastUpdated | date("MMMM dd, yyyy") }}</span></span>
    </div>
    <h1 class="h1">bKash ও Nagad Cash Out চার্জ ক্যালকুলেটর (২০২৬)</h1>
    <p class="lead">কত টাকা তুললে কত চার্জ কাটবে — এজেন্ট, প্রিয় এজেন্ট, ATM ও USSD সব রেটে এক ক্লিকে হিসাব করুন। রেটগুলো ২০২৬-এর যাচাইকৃত অফিসিয়াল চার্জ অনুযায়ী।</p>
  </section>

  <section class="card" aria-labelledby="calc-heading">
    <h2 id="calc-heading">ক্যালকুলেটর</h2>
    <div id="cashout-calc">
      <div style="display: grid; gap: 14px; max-width: 560px;">
        <label>ওয়ালেট ও পদ্ধতি
          <select id="cc-method" style="width: 100%; padding: 10px; margin-top: 6px; background: #0b1420; color: var(--text); border: 1px solid #243041; border-radius: 10px;">
            <option value="18.50">bKash — সাধারণ এজেন্ট (অ্যাপ / *247#) — ৳১৮.৫০/হাজার</option>
            <option value="14.90">bKash — প্রিয় এজেন্ট — ৳১৪.৯০/হাজার</option>
            <option value="14.90-atm">bKash — ATM (BRAC/City/Q-Cash) — ৳১৪.৯০/হাজার</option>
            <option value="12.50">Nagad — অ্যাপ — ৳১২.৫০/হাজার</option>
            <option value="15.00">Nagad — *167# (USSD) — ৳১৫.০০/হাজার</option>
          </select>
        </label>
        <label>হিসাবের ধরন
          <select id="cc-mode" style="width: 100%; padding: 10px; margin-top: 6px; background: #0b1420; color: var(--text); border: 1px solid #243041; border-radius: 10px;">
            <option value="cashout">আমি X টাকা cash out করব → চার্জসহ মোট কত কাটবে?</option>
            <option value="wallet">ওয়ালেটে X টাকা আছে, সব তুলব → হাতে কত পাব?</option>
          </select>
        </label>
        <label>টাকার পরিমাণ (৳)
          <input id="cc-amount" type="number" min="50" step="1" value="1000" inputmode="numeric" style="width: 100%; padding: 10px; margin-top: 6px; background: #0b1420; color: var(--text); border: 1px solid #243041; border-radius: 10px;">
        </label>
        <div id="cc-result" style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); border: 1px solid #10b981; border-radius: 12px; padding: 18px; font-size: 1.05rem; line-height: 1.7;"></div>
        <p class="note" id="cc-note"></p>
      </div>
    </div>
    <script>
      (function(){
        var method = document.getElementById('cc-method'),
            mode = document.getElementById('cc-mode'),
            amount = document.getElementById('cc-amount'),
            result = document.getElementById('cc-result'),
            note = document.getElementById('cc-note');
        function fmt(n){ return '৳' + n.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
        function calc(){
          var rate = parseFloat(method.value); // per 1000
          var x = parseFloat(amount.value);
          if (!x || x <= 0) { result.innerHTML = 'সঠিক amount দিন।'; return; }
          var html = '';
          if (mode.value === 'cashout') {
            var fee = x * rate / 1000;
            html = 'Cash out: <strong>' + fmt(x) + '</strong><br>চার্জ: <strong>' + fmt(fee) + '</strong> (৳' + rate.toFixed(2) + '/হাজার)<br>ওয়ালেট থেকে মোট কাটবে: <strong>' + fmt(x + fee) + '</strong>';
          } else {
            var receive = x / (1 + rate / 1000);
            var fee2 = x - receive;
            html = 'ওয়ালেট ব্যালেন্স: <strong>' + fmt(x) + '</strong><br>সর্বোচ্চ cash out করা যাবে: <strong>' + fmt(receive) + '</strong><br>চার্জ: <strong>' + fmt(fee2) + '</strong>';
          }
          result.innerHTML = html;
          note.textContent = method.value === '14.90-atm' ? 'ATM cash out-এ সাধারণত ন্যূনতম ৳৩,০০০ প্রযোজ্য — অ্যাপে verify করুন।' : (method.options[method.selectedIndex].text.indexOf('প্রিয়') > -1 ? 'প্রিয় এজেন্ট রেট মাসিক নির্দিষ্ট লিমিট পর্যন্ত (বর্তমানে ৳৫০,০০০) — লিমিট পার হলে সাধারণ রেট প্রযোজ্য।' : '');
        }
        method.addEventListener('change', calc);
        mode.addEventListener('change', calc);
        amount.addEventListener('input', calc);
        calc();
      })();
    </script>
  </section>

  <section class="card" aria-labelledby="rates-heading">
    <h2 id="rates-heading">২০২৬ সালের রেট টেবিল (যাচাইকৃত)</h2>
    <div style="overflow-x: auto;">
      <table>
        <thead>
          <tr><th>ওয়ালেট</th><th>পদ্ধতি</th><th>চার্জ / হাজার</th><th>শতাংশ</th></tr>
        </thead>
        <tbody>
          <tr><td>bKash</td><td>সাধারণ এজেন্ট (অ্যাপ / *247#)</td><td>৳১৮.৫০</td><td>১.৮৫%</td></tr>
          <tr><td>bKash</td><td>প্রিয় এজেন্ট (মাসে ৳৫০,০০০ পর্যন্ত)</td><td>৳১৪.৯০</td><td>১.৪৯%</td></tr>
          <tr><td>bKash</td><td>ATM (BRAC Bank / City Bank / Q-Cash)</td><td>৳১৪.৯০</td><td>১.৪৯%</td></tr>
          <tr><td>Nagad</td><td>অ্যাপ</td><td>৳১২.৫০</td><td>১.২৫%</td></tr>
          <tr><td>Nagad</td><td>*167# (USSD)</td><td>৳১৫.০০</td><td>১.৫০%</td></tr>
        </tbody>
      </table>
    </div>
    <ul class="note">
      <li>প্রকাশিত চার্জ VAT-সহ; Islamic account-এও একই রেট (Nagad)।</li>
      <li>Send Money (bKash): প্রিয় নম্বরে মাসে ৳২৫,০০০ পর্যন্ত ফ্রি; অন্য নম্বরে সাধারণত ৳৫ (মাসিক ৳২৫,০০০ পর্যন্ত), তার বেশি হলে ৳১০/লেনদেন।</li>
      <li>রেট ও লিমিট অপারেটর পরিবর্তন করতে পারে — বড় লেনদেনের আগে নিজের অ্যাপে চূড়ান্ত চার্জ দেখে নিন।</li>
    </ul>
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
      <li><a href="/tools/wagering-calculator/">Wagering Calculator — বোনাস টার্নওভার হিসাব</a></li>
      <li><a href="/borojeet-bkash-deposit/">BoroJeet bKash Deposit গাইড</a></li>
      <li><a href="/blog/bkash-deposit-minimum-maximum-betting-guide/">bKash deposit limit গাইড</a></li>
      <li><a href="/blog/bkash-cashout-delay-after-approved/">Cashout delay হলে করণীয়</a></li>
    </ul>
    <p class="note">তথ্যসূত্র: bKash ও Nagad-এর প্রকাশিত ট্যারিফ, একাধিক স্বাধীন রেট-ট্র্যাকার সূত্রে ক্রস-চেক করা (সর্বশেষ যাচাই: ১৩ জুলাই ২০২৬)। এই টুলটি তথ্যমূলক — চূড়ান্ত চার্জ আপনার অ্যাপে দেখুন।</p>
  </section>
</main>

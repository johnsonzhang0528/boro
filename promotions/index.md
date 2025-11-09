---
layout: "base.njk"
title: "BoroJeet Promotions: সকল বোনাস ও অফার"
description: "বাংলাদেশের খেলোয়াড়দের জন্য BoroJeet-এর সকল প্রোমোশন দেখুন।"
date: 2025-11-09
---

<main class="wrap">
  <section class="hero">
    <h1>BoroJeet প্রোমোশন ও বোনাস অফার</h1>
    <p>BoroJeet-এ উপলব্ধ সমস্ত উত্তেজনাপূর্ণ বোনাস এবং অফারগুলি আবিষ্কার করুন।</p>
  </section>

  <section class="grid grid-3">
    {% for category in promotions %}
      <div class="card">
        <h3>{{ category.category }}</h3>
        <p>{{ category.description }}</p>
        <a href="/promotions/{{ category.slug }}/" class="cta-link">বিস্তারিত দেখুন</a>
      </div>
    {% endfor %}
  </section>
</main>

const slugify = require("@sindresorhus/slugify");

const promotions = [
  {
    category: "🎁 Newbie Offers",
    date: "2025-11-14",
    slug: "newbie",
    description: "Exclusive offers for new players joining BoroJeet.",
    items: [
      {
        title: "BoroJeet রেজিস্ট্রেশন বোনাস: ৳100 ফ্রি পান!",
        slug: "free-100-registration-bonus",
        image: "/assets/promotions/promo-registration-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "BoroJeet-এ যোগ দিন এবং বিনামূল্যে ৳100 রেজিস্ট্রেশন বোনাস উপভোগ করুন। এই এক্সক্লুসিভ অফারটি শুধুমাত্র অ্যাপ ব্যবহারকারীদের জন্য।",
        seo_title: "BoroJeet রেজিস্ট্রেশন বোনাস | বিনামূল্যে ৳100 পান!",
        seo_description: "BoroJeet-এ সাইন আপ করে বিনামূল্যে ৳100 রেজিস্ট্রেশন বোনাস পান! এই অফারটি শুধুমাত্র আমাদের মোবাইল অ্যাপ ব্যবহারকারীদের জন্য উপলব্ধ।",
        rules: [
          "Bonus: 100",
          "Max Withdraw: 100",
          "Turnover: 30x",
          "Game Kind: Slots",
          "Note: App-Only Promotion",
          "Join Amount: Not Required",
          "Eligible Players: VIP 2 to VIP 5",
          "Availability: Once per Player",
          "Game Platforms: All Game Platforms"
        ]
      },
      {
        title: "BoroJeet স্বাগতম বোনাস: 400% বোনাস পান!",
        slug: "welcome-to-borojeet-get-400-percent-bonus",
        image: "/assets/promotions/promo-welcome-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "BoroJeet পরিবারে আপনাকে স্বাগত জানাতে একটি বিশাল 400% বোনাস। নতুন খেলোয়াড়দের জন্য সেরা অফার।",
        seo_title: "BoroJeet স্বাগতম বোনাস | 400% বুস্ট পান!",
        seo_description: "BoroJeet-এ নতুন? আপনার 400% স্বাগতম বোনাস দাবি করুন এবং একটি বিশাল সুবিধা নিয়ে খেলা শুরু করুন। এখনই 100 টাকা জমা দিন এবং শুরু করুন!",
        rules: [
          "Bonus: 400%",
          "Join Amount: 100",
          "Max Withdraw: 500",
          "Turnover: 20x",
          "Condition: Today's Deposit must be 100",
          "Game Kind: Slots & Crash Games",
          "Eligible Player: Only for VIP 2 and above",
          "Availability: Once per Player"
        ]
      },
      {
        title: "স্বাগতম Crash বোনাস: 100% পর্যন্ত!",
        slug: "welcome-crash-bonus-up-to-100-percent",
        image: "/assets/promotions/promo-welcome-crash-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2025-11-20",
        status: "expired",
        details: "আমাদের উত্তেজনাপূর্ণ Crash গেমগুলির জন্য বিশেষভাবে 100% বোনাস পান। আপনার জেতার সুযোগ দ্বিগুণ করুন।",
        seo_title: "BoroJeet Crash গেম বোনাস | 100% স্বাগতম অফার",
        seo_description: "Crash গেম ভালোবাসেন? BoroJeet-এ 100% স্বাগতম বোনাস পান। 200 টাকা জমা দিন এবং Aviator-এর মতো গেমে বড় জয়ের সুযোগ দ্বিগুণ করুন।",
        rules: [
          "Bonus: 100%",
          "Join Amount: 200",
          "Max Withdraw: 1,000",
          "Turnover: 20x",
          "Condition: Today's Deposit must be 200",
          "Game Kind: Crash",
          "Eligible Player: Only for VIP 2 and above",
          "Availability: Once per Player"
        ]
      },
      {
        title: "স্বাগতম Fisher বোনাস: 200% পর্যন্ত!",
        slug: "welcome-fisher-bonus-up-to-200-percent",
        image: "/assets/promotions/promo-welcome-fisher-optimized.webp",
        startDate: "2025-08-04",
        endDate: "2031-08-04",
        details: "সমস্ত ফিশিং গেম উত্সাহীদের জন্য একটি বিশেষ 200% বোনাস। মাছ ধরুন এবং বড় পুরস্কার জিতুন।",
        seo_title: "BoroJeet ফিশিং গেম বোনাস | 200% স্বাগতম অফার",
        seo_description: "আপনি কি ফিশিং গেমের ভক্ত? BoroJeet-এ 200% স্বাগতম বোনাস দাবি করুন। 300 টাকা জমা দিন এবং একটি বিশাল বুস্ট নিয়ে আপনার ফিশিং অ্যাডভেঞ্চার শুরু করুন।",
        rules: [
          "Bonus: 200%",
          "Join Amount: 300",
          "Max Withdraw: 1,500",
          "Turnover: 20x",
          "Condition: Today's Deposit must be 300",
          "Game Kind: Fisher",
          "Eligible Player: Only for VIP 2 and above",
          "Availability: Once per Player"
        ]
      },
      {
        title: "স্বাগতম Slot বোনাস: 300% পর্যন্ত!",
        slug: "welcome-slot-bonus-up-to-300-percent",
        image: "/assets/promotions/promo-welcome-slot-optimized.webp",
        startDate: "2025-08-04",
        endDate: "2031-08-05",
        details: "বিভিন্ন ধরণের স্লট গেমে 300% বোনাস উপভোগ করুন। স্পিন করুন এবং BoroJeet-এ বড় জিতুন।",
        seo_title: "BoroJeet স্লট গেম বোনাস | 300% স্বাগতম অফার",
        seo_description: "BoroJeet-এ স্লট গেমে 300% স্বাগতম বোনাস নিয়ে স্পিন করুন এবং জিতুন। 300 টাকা জমা দিন এবং আপনার প্রিয় স্লট খেলতে একটি বিশাল বুস্ট পান।",
        rules: [
          "Bonus: 300%",
          "Join Amount: 300",
          "Max Withdraw: 1,500",
          "Turnover: 20x",
          "Condition: Today's Deposit must be 300",
          "Game Kind: Slot",
          "Eligible Player: Only for VIP 2 and above",
          "Availability: Once per Day"
        ]
      },
      {
        title: "BoroJeet অ্যাপ বোনাস: ৳150 পর্যন্ত ফ্রি!",
        slug: "application-bonus-claim-up-to-150-free",
        image: "/assets/promotions/promo-app-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "আমাদের অ্যাপে উপলব্ধ তিনটি এক্সক্লুসিভ বোনাস প্ল্যান থেকে একটি বেছে নিন। শুধুমাত্র অ্যাপ ব্যবহারকারীদের জন্য।",
        seo_title: "BoroJeet অ্যাপ বোনাস | ৳150 পর্যন্ত ফ্রি ক্লেম করুন",
        seo_description: "BoroJeet অ্যাপ ডাউনলোড করুন এবং 150 পর্যন্ত একটি এক্সক্লুসিভ বোনাস দাবি করুন। শুধুমাত্র অ্যাপ ব্যবহারকারীদের জন্য বিশেষ অফার উপলব্ধ।",
        rules: [
          "Plan 1 (Bonus 150): Condition: Total Deposit 1,000 | Max Withdraw: 200 | Turnover: 10x",
          "Plan 2 (Bonus 100): Condition: Total Deposit 500 | Max Withdraw: 150 | Turnover: 10x",
          "Plan 3 (Bonus 50): Condition: Total Deposit 300 | Max Withdraw: 100 | Turnover: 10x",
          "Game Kind: Slots & Crash",
          "Eligible Player: All VIP Levels",
          "Availability: Once per Player"
        ]
      }
    ]
  },
  {
    category: "✨ Special Offers",
    date: "2025-11-14",
    slug: "special",
    description: "Limited-time offers for special events and holidays.",
    items: [
      {
        title: "300% হ্যাপি উইকেন্ড বোনাস",
        slug: "300-percent-happy-weekend-bonus",
        image: "/assets/promotions/promo-weekend-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "একটি বিশাল 300% বোনাস দিয়ে আপনার সপ্তাহান্তকে আরও আনন্দময় করে তুলুন। শনি ও রবিবারের জন্য বিশেষ অফার।",
        seo_title: "BoroJeet উইকেন্ড বোনাস | 300% বুস্ট পান!",
        seo_description: "BoroJeet-এ 300% বোনাস দিয়ে আপনার সপ্তাহান্ত উপভোগ করুন। শনি বা রবিবার 300 টাকা জমা দিন এবং স্লট ও ফিশার গেম খেলতে 900 টাকা অতিরিক্ত পান।",
        rules: [
          "Bonus: ৳900",
          "Join Amount: ৳300",
          "Max Withdraw: ৳1,800",
          "Turnover: 25x",
          "Condition: Today's Deposit: 300",
          "Game Kind: Slots & Fisher",
          "Eligible Player: All VIP Levels",
          "Availability: Once daily (Saturday & Sunday)"
        ]
      },
      {
        title: "পে-ডে বুস্ট: সমস্ত গেমে ৳3,000 পর্যন্ত জিতুন!",
        slug: "payday-boost-win-up-to-3000",
        image: "/assets/promotions/promo-payday-boost-optimized.webp",
        startDate: "2025-11-01",
        endDate: "2030-12-31",
        details: "বেতনের দিনে একটি বিশেষ বুস্ট পান এবং সমস্ত গেমে ৳3,000 পর্যন্ত জিতে নিন। মাসের সেরা অফার।",
        seo_title: "BoroJeet পে-ডে বুস্ট | ৳3,000 পর্যন্ত জিতুন",
        seo_description: "BoroJeet-এর সাথে পে-ডে উদযাপন করুন! মাসের 1 বা 15 তারিখে 200 টাকা জমা দিয়ে স্লট এবং ফিশার গেমে 3,000 টাকা পর্যন্ত জেতার সুযোগ পান।",
        rules: [
          "Bonus: 200",
          "Join Amount: 200",
          "Max Withdraw: 3,000",
          "Turnover: Not Required",
          "Condition: Deposit 200 on the promotion day",
          "Game Kind: Slot & Fisher",
          "Eligible Player: All VIP Levels",
          "Availability: Every 1st & 15th of the Month",
          "How to Win?: Play until promotional wallet hits 4,000"
        ]
      },
      {
        title: "শুভ জন্মদিন বোনাস: ৳6,000 পর্যন্ত পান!",
        slug: "happy-birthday-bonus-get-up-to-6000",
        image: "/assets/promotions/promo-birthday-bonus-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "আপনার জন্মদিনে আমাদের কাছ থেকে একটি বিশেষ বোনাস উপভোগ করুন, যার মূল্য ৳6,000 পর্যন্ত!",
        seo_title: "BoroJeet জন্মদিন বোনাস | ৳6,000 পর্যন্ত বিনামূল্যে পান",
        seo_description: "BoroJeet-এর পক্ষ থেকে জন্মদিনের শুভেচ্ছা! আপনার জন্ম মাসে 6,000 টাকা পর্যন্ত একটি বিশেষ জন্মদিনের বোনাস দাবি করুন। আপনার ভিআইপি লেভেল যত বেশি, বোনাস তত বড়।",
        rules: [
          "Availability: Once per Year, on your birth month.",
          "Claim Time: Claim from Bonus Notification after 12:00 PM on the 15th of your birth month.",
          "Main Bonus (VIP 2-20): From 50 to 1,000 based on VIP level.",
          "Extra Bonus (VIP 2-20): From 550 to 6,000 based on total deposit.",
          "Wagering: 1x to 3x, depending on VIP level."
        ]
      }
    ]
  },
  {
    category: "☀️ Daily Offers",
    date: "2025-11-14",
    slug: "daily",
    description: "Get new bonuses and rewards every day.",
    items: [
      {
        title: "ডিপোজিট বুস্ট: 0.5% থেকে 3% বোনাস!",
        slug: "deposit-boost-bonus",
        image: "/assets/promotions/promo-deposit-boost-optimized.webp",
        startDate: "2025-10-05",
        endDate: "2030-12-31",
        details: "বিশেষ প্রচারের দিনগুলিতে আপনার ডিপোজিটে 0.5% থেকে 3% পর্যন্ত বোনাস পান। আনলিমিটেড বোনাস!",
        seo_title: "BoroJeet ডিপোজিট বুস্ট | 0.5% থেকে 3% অতিরিক্ত পান",
        seo_description: "BoroJeet-এ আপনার ডিপোজিট বুস্ট করুন! আমাদের বিশেষ প্রচারের দিনগুলিতে করা ডিপোজিটে অতিরিক্ত 0.5% থেকে 3% বোনাস পান। আনলিমিটেড বোনাস সম্ভাবনা!",
        rules: [
          "Bonus Rate: 0.5% to 3%",
          "Maximum Bonus: Unlimited",
          "Minimum Deposit: 100",
          "Turnover: 3x",
          "Eligible Players: All VIP Levels",
          "Availability: 1st & 3rd Sunday, Monday, and Tuesday of every month."
        ]
      },
      {
        title: "ডেইলি বোনাস: প্রতিদিন বিনামূল্যে ৳200",
        slug: "daily-bonus-free-200",
        image: "/assets/promotions/promo-daily-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "প্রতিদিন বিনামূল্যে ৳200 বোনাস দাবি করুন। BoroJeet-এ আপনার প্রতিদিনের পুরস্কার।",
        seo_title: "BoroJeet ডেইলি বোনাস | প্রতিদিন বিনামূল্যে ৳200 ক্লেম করুন",
        seo_description: "BoroJeet-এ লগইন করুন এবং আপনার বিনামূল্যে ৳200 দৈনিক বোনাস দাবি করুন! আজ 300 টাকা জমা দিন এবং স্লট ও কার্ড গেমের জন্য অতিরিক্ত ফান্ড উপভোগ করুন।",
        rules: [
          "Bonus: 100",
          "Join Amount: not required",
          "Max Withdraw: 200",
          "Turnover: 30x",
          "Condition: Today's Deposit: 300",
          "Game Kind: Slots & Card",
          "Game Platforms: All Game Platforms",
          "Eligible Player: All VIP Levels",
          "Availability: Once per Day"
        ]
      },
      {
        title: "অ্যাপ ডেইলি উইনস 200%",
        slug: "app-daily-wins-200-percent",
        image: "/assets/promotions/promo-app-daily-wins-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "শুধুমাত্র BoroJeet অ্যাপে প্রতিদিন 200% পর্যন্ত জিতুন। অ্যাপ ব্যবহারকারীদের জন্য এক্সক্লুসিভ অফার।",
        seo_title: "BoroJeet অ্যাপ ডেইলি উইনস | 200% বোনাস পান",
        seo_description: "BoroJeet অ্যাপ ব্যবহার করে 200% দৈনিক বোনাস পান। মাত্র ৳50 জমা দিন এবং স্লট, ফিশার এবং ক্র্যাশ গেমে ৳200 পর্যন্ত জিতুন।",
        rules: [
          "Bonus: ৳100",
          "Join Amount: ৳50",
          "Max Withdraw: ৳200",
          "Turnover: 20x",
          "Condition: Today's Deposit: 50",
          "Game Kind: Slots & Fisher & Crash",
          "Note: App-Only Participation"
        ]
      },
      {
        title: "100% ডেইলি স্লট বোনাস",
        slug: "100-percent-daily-slot-bonus",
        image: "/assets/promotions/promo-daily-slot-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "আপনার স্লট গেম অ্যাডভেঞ্চারকে আরও মজাদার করতে প্রতিদিন 100% বোনাস।",
        seo_title: "BoroJeet ডেইলি স্লট বোনাস | 100% ম্যাচ বোনাস",
        seo_description: "BoroJeet-এ স্লট গেমের জন্য প্রতিদিন 100% ম্যাচ বোনাস পান। 200 টাকা জমা দিন এবং আপনার জেতার সুযোগ বাড়াতে 400 টাকা দিয়ে খেলুন।",
        rules: [
          "Bonus: ৳200",
          "Join Amount: ৳200",
          "Max Withdraw: ৳1,000",
          "Turnover: 20x",
          "Condition: Today's Deposit: 200",
          "Game Kind: Slot",
          "Game Platforms: All Game Platforms",
          "Eligible Player: All VIP Levels",
          "Availability: Once per Day"
        ]
      },
      {
        title: "100% ডেইলি ফিশার বোনাস",
        slug: "100-percent-daily-fisher-bonus",
        image: "/assets/promotions/promo-daily-fisher-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "ফিশিং গেমগুলির জন্য প্রতিদিন 100% বোনাস দিয়ে একটি বড় জয় অর্জন করুন।",
        seo_title: "BoroJeet ডেইলি ফিশার বোনাস | 100% ম্যাচ বোনাস",
        seo_description: "ফিশিং গেম ভালোবাসেন? BoroJeet-এ 100% দৈনিক বোনাস পান। 200 টাকা জমা দিন এবং সবচেয়ে বড় মাছ শিকারের জন্য অতিরিক্ত 200 টাকা পান।",
        rules: [
          "Bonus: ৳200",
          "Join Amount: ৳200",
          "Max Withdraw: ৳800",
          "Turnover: 20x",
          "Condition: Today's Deposit: 200",
          "Game Kind: Fisher"
        ]
      },
      {
        title: "100% ডেইলি ক্র্যাশ বোনাস",
        slug: "100-percent-daily-crash-bonus",
        image: "/assets/promotions/promo-daily-crash-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2025-11-20",
        status: "expired",
        details: "আমাদের রোমাঞ্চকর ক্র্যাশ গেমগুলির জন্য প্রতিদিন 100% বোনাস পান।",
        seo_title: "BoroJeet ডেইলি ক্র্যাশ বোনাস | 100% ম্যাচ বোনাস",
        seo_description: "আমাদের উত্তেজনাপূর্ণ ক্র্যাশ গেমগুলি 100% দৈনিক বোনাস সহ উপভোগ করুন। 200 টাকা জমা দিন এবং উচ্চ মাল্টিপ্লায়ারের আরও ভালো সুযোগের জন্য 400 টাকা দিয়ে খেলুন।",
        rules: [
          "Bonus: ৳200",
          "Join Amount: ৳200",
          "Max Withdraw: ৳600",
          "Turnover: 20x",
          "Condition: Today's Deposit: 200",
          "Game Kind: Crash"
        ]
      },
      {
        title: "ডেইলি স্লট ও ক্র্যাশ বোনাস: ৳1,000 পর্যন্ত জিতুন!",
        slug: "daily-slots-crash-bonus-win-1000",
        image: "/assets/promotions/promo-win-1000-daily-optimized.webp",
        startDate: "2025-11-16",
        endDate: "2030-12-31",
        details: "প্রতিদিন ৳1,000 পর্যন্ত জেতার সুযোগের জন্য স্লট এবং ক্র্যাশ গেম খেলুন।",
        seo_title: "BoroJeet ডেইলি বোনাস | স্লট ও ক্র্যাশে ৳1,000 পর্যন্ত জিতুন",
        seo_description: "প্রতিদিন 100 টাকা জমা দিন এবং স্লট বা ক্র্যাশ গেম খেলে এটিকে 1,000 টাকায় পরিণত করার সুযোগ পান! আপনার জয়ের উপর কোনো টার্নওভারের প্রয়োজন নেই।",
        rules: [
          "Bonus: 88",
          "Join Amount: 100",
          "Max Withdraw: 1,000",
          "Turnover: Not Required",
          "Condition: Daily Deposit of 100",
          "How to Win?: Play until promotional wallet reaches 1,000"
        ]
      },
      {
        title: "99,999 লাকি ড্র: স্পিন করুন এবং বড় জিতুন",
        slug: "99999-lucky-draw-spin-win-big",
        image: "/assets/promotions/promo-lucky-draw-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "আমাদের লাকি ড্র-তে অংশ নিয়ে 99,999 টাকা পর্যন্ত জেতার সুযোগ!",
        seo_title: "BoroJeet 99,999 লাকি ড্র | প্রতিদিন স্পিন করুন এবং জিতুন",
        seo_description: "BoroJeet লাকি ড্র-তে যোগ দিন! 1,000 টাকা জমা দিন এবং প্রতিদিন 99,999 টাকা পর্যন্ত জেতার সুযোগের জন্য টার্নওভারের প্রয়োজনীয়তা পূরণ করুন।",
        rules: [
          "Turnover: 1x",
          "Availability: Once per Day",
          "Condition: Deposit 1,000 and valid turnover of 10,000 on the same day.",
          "Game Kind: Slot & Fisher & Crash",
          "Prizes: Vary by VIP level, up to 99,999."
        ]
      },
      {
        title: "300 লগইন ড্র: শুধু লগইন করুন এবং পয়েন্ট জিতুন",
        slug: "300-login-draw-win-points",
        image: "/assets/promotions/promo-login-draw-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "প্রতিদিন লগইন করে 300 পয়েন্ট পর্যন্ত জেতার সুযোগ। কোনো ডিপোজিট প্রয়োজন নেই!",
        seo_title: "BoroJeet লগইন ড্র | প্রতিদিন 300 পয়েন্ট পর্যন্ত জিতুন",
        seo_description: "প্রতিদিন BoroJeet-এ লগইন করুন এবং 300 পর্যন্ত বিনামূল্যে পয়েন্ট জেতার সুযোগ পান। কোনো ডিপোজিট বা টার্নওভারের প্রয়োজন নেই। শুধু লগইন করুন এবং জিতুন!",
        rules: [
          "Eligible Players: VIP Level 2 to VIP 20",
          "Availability: Once per day.",
          "Rewards: Randomly draw 50, 100, 150, 200, 250, or 300 points.",
          "Note: No deposit or turnover required."
        ]
      },
      {
        title: "7-দিনের চেক-ইন চ্যালেঞ্জ: প্রতিদিন পুরস্কার!",
        slug: "7-day-check-in-challenge",
        image: "/assets/promotions/promo-check-in-challenge-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "টানা ৭ দিন দৈনিক কাজগুলি সম্পন্ন করে ক্রমবর্ধমান পুরস্কার দাবি করুন।",
        seo_title: "BoroJeet 7-দিনের চেক-ইন চ্যালেঞ্জ | দৈনিক পুরস্কার",
        seo_description: "BoroJeet 7-দিনের চেক-ইন চ্যালেঞ্জ গ্রহণ করুন! প্রতিদিন 200 টাকা জমা দিন এবং এক সপ্তাহের জন্য প্রতিদিন ক্রমবর্ধমান পুরস্কার অর্জন করতে টার্নওভার লক্ষ্য পূরণ করুন।",
        rules: [
          "Daily Task: Deposit 200 BDT & achieve 1,000 BDT valid turnover.",
          "Rewards: Increase daily from 1 BDT to 50 BDT on Day 7.",
          "Total Reward: Up to 119 BDT for 7 consecutive days.",
          "Bonus Turnover: 1x"
        ]
      },
      {
        title: "প্রতিটি ডিপোজিটে 0.5% বোনাস",
        slug: "0-5-percent-bonus-on-every-deposit",
        image: "/assets/promotions/promo-deposit-reward-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "আপনার করা প্রতিটি ডিপোজিটে অতিরিক্ত 0.5% বোনাস পান। কোনো সীমা নেই!",
        seo_title: "BoroJeet ডিপোজিট বোনাস | প্রতিটি ডিপোজিটে 0.5% অতিরিক্ত পান",
        seo_description: "BoroJeet-এ আপনার করা প্রতিটি ডিপোজিটে 0.5% বোনাস পান। বোনাসের পরিমাণে কোনো সীমা নেই। যোগ্যতা অর্জনের জন্য 100 বা তার বেশি জমা দিন।",
        rules: [
          "Bonus Rate: 0.5% on Every Deposit",
          "Maximum Bonus: Unlimited",
          "Minimum Deposit: 100",
          "Turnover: 3x"
        ]
      }
    ]
  },
  {
    category: "👑 VIP Loyalty",
    date: "2025-11-14",
    slug: "vip",
    description: "Exclusive rewards for our loyal players.",
    items: [
      {
        title: "সাপ্তাহিক ফেসবুক শেয়ার: বিনামূল্যে ৳100",
        slug: "100-taka-free-weekly-facebook-share",
        image: "/assets/promotions/promo-weekly-facebook-share-optimized.webp",
        startDate: "2025-07-31",
        endDate: "2030-12-31",
        details: "সাপ্তাহিকভাবে ফেসবুকে শেয়ার করুন এবং বিনামূল্যে 100 টাকা পান। আপনার আনুগত্যের জন্য পুরস্কার।",
        seo_title: "BoroJeet ফেসবুক শেয়ার বোনাস | সাপ্তাহিক বিনামূল্যে ৳100 পান",
        seo_description: "আপনার ফেসবুকে BoroJeet শেয়ার করুন এবং প্রতি সপ্তাহে 100 টাকা বোনাস পান। 300 টাকার সাপ্তাহিক ডিপোজিট সহ VIP 5+ সদস্যদের জন্য উপলব্ধ।",
        rules: [
          "Bonus: 100",
          "Join Amount: Not Required",
          "Max Withdraw: Unlimited",
          "Condition: Weekly Total Deposit: 300",
          "Eligible Player: VIP 5 and above",
          "Release Time: November 17th, 00:00:00 ~ November 23th, 23:59:59",
          "Turnover: 1x",
          "Note: Your Facebook entry will be reviewed. If it is not visible on your profile,the reward may not be issued."
        ]
      },
      {
        title: "মাসিক ভিআইপি বোনাস: ৳4,000 পর্যন্ত আয় করুন",
        slug: "monthly-vip-bonus-earn-up-to-4000",
        image: "/assets/promotions/promo-monthly-vip-bonus-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "অনুগত ভিআইপিরা 4,000 টাকা পর্যন্ত মাসিক বোনাস অর্জন করতে পারেন।",
        seo_title: "BoroJeet মাসিক ভিআইপি বোনাস | ৳4,000 পর্যন্ত আয় করুন",
        seo_description: "BoroJeet-এর একজন অনুগত ভিআইপি হিসেবে, আপনি 4,000 টাকা পর্যন্ত মাসিক বোনাস অর্জন করতে পারেন। আপনার কার্যকলাপ বজায় রাখুন এবং প্রতি মাসের 1 তারিখে পুরস্কৃত হন।",
        rules: [
          "Bonus: 200 to 4,000, based on VIP level.",
          "Requirement: Varies by VIP level (e.g., VIP 2-4 needs 500 deposit & 40,000 turnover).",
          "Turnover Requirement: 3x",
          "Monthly Requirement: Minimum of 14 deposits and 7 logins.",
          "Distribution: 12:00 PM on the 1st of the following month."
        ]
      },
      {
        title: "সাপ্তাহিক ভিআইপি বোনাস: ৳2,000 পর্যন্ত পান",
        slug: "weekly-vip-bonus-get-up-to-2000",
        image: "/assets/promotions/promo-weekly-vip-bonus-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "আমাদের ভিআইপি খেলোয়াড়দের জন্য একটি সাপ্তাহিক বোনাস, যার পুরস্কার 2,000 টাকা পর্যন্ত।",
        seo_title: "BoroJeet সাপ্তাহিক ভিআইপি বোনাস | ৳2,000 পর্যন্ত পান",
        seo_description: "আমাদের ভিআইপি বোনাস দিয়ে BoroJeet-এ প্রতি সপ্তাহে পুরস্কৃত হন। আপনার ভিআইপি লেভেল এবং সাপ্তাহিক কার্যকলাপের উপর ভিত্তি করে 2,000 টাকা পর্যন্ত আয় করুন। বোনাস প্রতি শুক্রবার প্রদান করা হয়।",
        rules: [
          "Bonus: 100 to 2,000, based on VIP level.",
          "Requirement: Varies by VIP level (e.g., VIP 2-4 needs 250 deposit & 20,000 turnover).",
          "Turnover Requirement: 3x",
          "Weekly Requirement: Minimum of 5 deposits during the activity period (Fri-Thu).",
          "Distribution: 12:00 PM every Friday."
        ]
      },
      {
        title: "ভিআইপি আপগ্রেড বোনাস: ৳6,000 পর্যন্ত পান",
        slug: "vip-upgrade-bonus-get-up-to-6000",
        image: "/assets/promotions/promo-vip-upgrade-bonus-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "যতবার আপনি আপনার ভিআইপি লেভেল আপগ্রেড করবেন, ততবার 6,000 টাকা পর্যন্ত বোনাস পাবেন।",
        seo_title: "BoroJeet ভিআইপি আপগ্রেড বোনাস | ৳6,000 পর্যন্ত পান",
        seo_description: "BoroJeet-এ আপনার ভিআইপি স্ট্যাটাস লেভেল আপ করুন এবং 6,000 টাকা পর্যন্ত একটি তাত্ক্ষণিক বোনাস পান। আপনি যত উপরে উঠবেন, পুরস্কার তত বড় হবে।",
        rules: [
          "Bonus: 5 (for VIP 2) up to 6,000 (for VIP 20).",
          "Requirement: Reach a new VIP level based on total deposit and turnover.",
          "Turnover Requirement: 3x",
          "Distribution: Bonus is credited instantly upon level up."
        ]
      }
    ]
  },
  {
    category: "💰 Rebate Offers",
    date: "2025-11-14",
    slug: "rebate",
    description: "Get daily rebates on your turnover. The more you play, the more you get back!",
    items: [
      {
        title: "স্লট ও ফিশারে 1.5% ডেইলি রিবেট",
        slug: "1-5-percent-daily-rebate-on-slot-fisher",
        image: "/assets/promotions/promo-daily-rebate-slot-fisher-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "স্লট এবং ফিশার গেমগুলিতে আপনার টার্নওভারে প্রতিদিন 1.5% পর্যন্ত রিবেট অর্জন করুন।",
        seo_title: "BoroJeet ডেইলি রিবেট | স্লট ও ফিশার গেমে 1.5%",
        seo_description: "BoroJeet-এ স্লট এবং ফিশার গেম খেলুন এবং আপনার টার্নওভারে 1.5% পর্যন্ত দৈনিক রিবেট পান। আপনি যত বেশি খেলবেন, তত বেশি ফেরত পাবেন!",
        rules: [
          "Game Kind: Slot & Fisher",
          "Rebate Rate: Varies from 0.4% to 1.5% based on VIP level and daily turnover.",
          "Minimum Bonus: 1 BDT",
          "Maximum Bonus: Unlimited",
          "Turnover: 1x",
          "Release Time: 12:00 PM Daily"
        ]
      },
      {
        title: "ক্র্যাশ, লাইভ ও স্পোর্টসে 1.0% ডেইলি রিবেট",
        slug: "1-0-percent-daily-rebate-on-crash-live-sports",
        image: "/assets/promotions/promo-daily-rebate-crash-live-sport-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "ক্র্যাশ, লাইভ ক্যাসিনো এবং স্পোর্টস বেটিংয়ে 1.0% পর্যন্ত দৈনিক রিবেট পান।",
        seo_title: "BoroJeet ডেইলি রিবেট | ক্র্যাশ, লাইভ ও স্পোর্টসে 1.0%",
        seo_description: "BoroJeet-এ ক্র্যাশ গেম, লাইভ ক্যাসিনো এবং স্পোর্টস বেটিং থেকে আপনার টার্নওভারে 1.0% পর্যন্ত দৈনিক রিবেট পান। আনলিমিটেড বোনাস সম্ভাবনা!",
        rules: [
          "Game Kind: Crash, Live, Sports",
          "Rebate Rate: Varies from 0.1% to 1.0% based on VIP level and daily turnover.",
          "Minimum Bonus: 1 BDT",
          "Maximum Bonus: Unlimited",
          "Turnover: 1x",
          "Release Time: 12:00 PM Daily"
        ]
      },
      {
        title: "অন্যান্য সব গেমে 0.9% ডেইলি রিবেট",
        slug: "0-9-percent-daily-rebate-on-all-other-games",
        image: "/assets/promotions/promo-daily-rebate-all-games-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "টেবিল গেম, আর্কেড, কার্ড গেম এবং আরও অনেক কিছুতে 0.9% পর্যন্ত দৈনিক রিবেট উপভোগ করুন।",
        seo_title: "BoroJeet ডেইলি রিবেট | টেবিল, আর্কেড ও কার্ড গেমে 0.9%",
        seo_description: "BoroJeet-এ বিভিন্ন ধরণের গেম খেলুন এবং 0.9% পর্যন্ত দৈনিক রিবেট অর্জন করুন। এর মধ্যে রয়েছে টেবিল গেম, আর্কেড, কার্ড গেম এবং আরও অনেক কিছু।",
        rules: [
          "Game Kind: Table, Arcade, Card, Lottery, Cockfighting, Others",
          "Rebate Rate: Varies from 0.1% to 0.9% based on VIP level and daily turnover.",
          "Minimum Bonus: 1 BDT",
          "Maximum Bonus: Unlimited",
          "Turnover: 1x",
          "Release Time: 12:00 PM Daily"
        ]
      }
    ]
  },
  {
    category: "💸 Cashback Offers",
    date: "2025-11-14",
    slug: "cashback",
    description: "Get a percentage of your losses back. A safety net for our players.",
    items: [
      {
        title: "স্লট ও ফিশারে 8% পর্যন্ত ক্যাশব্যাক",
        slug: "up-to-8-percent-losing-commission-on-slot-fisher",
        image: "/assets/promotions/promo-losing-commission-slot-fisher-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "স্লট এবং ফিশার গেমগুলিতে আপনার সাপ্তাহিক ক্ষতির 8% পর্যন্ত ফেরত পান।",
        seo_title: "BoroJeet ক্যাশব্যাক | স্লট ও ফিশারে 8% পর্যন্ত",
        seo_description: "সপ্তাহটা খারাপ গেছে? BoroJeet-এ স্লট এবং ফিশার গেমে আপনার ক্ষতির 8% পর্যন্ত ফেরত পান। কমিশন প্রতি সোমবার প্রদান করা হয়।",
        rules: [
          "Game Kind: Slot & Fisher",
          "Commission Rate: Varies from 1.5% to 8.0% based on VIP level and weekly loss.",
          "Minimum Bonus: 1 BDT",
          "Maximum Bonus: Unlimited",
          "Turnover: 1x",
          "Release Time: 12:00 PM every Monday"
        ]
      },
      {
        title: "ক্র্যাশ, লাইভ ও স্পোর্টসে 5% পর্যন্ত ক্যাশব্যাক",
        slug: "up-to-5-percent-losing-commission-on-crash-live-sports",
        image: "/assets/promotions/promo-losing-commission-crash-live-sports-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "ক্র্যাশ, লাইভ ক্যাসিনো এবং স্পোর্টসে আপনার সাপ্তাহিক ক্ষতির উপর 5% পর্যন্ত ক্যাশব্যাক পান।",
        seo_title: "BoroJeet ক্যাশব্যাক | ক্র্যাশ, লাইভ ও স্পোর্টসে 5% পর্যন্ত",
        seo_description: "BoroJeet-এ ক্র্যাশ, লাইভ ক্যাসিনো এবং স্পোর্টস বেটিংয়ে 5% পর্যন্ত ক্যাশব্যাক সহ একটি সুরক্ষা জাল পান। ক্যাশব্যাক প্রতি সোমবার জমা হয়।",
        rules: [
          "Game Kind: Crash, Live, Sports",
          "Commission Rate: Varies from 0.7% to 5.0% based on VIP level and weekly loss.",
          "Minimum Bonus: 1 BDT",
          "Maximum Bonus: Unlimited",
          "Turnover: 1x",
          "Release Time: 12:00 PM every Monday"
        ]
      },
      {
        title: "অন্যান্য সব গেমে 2.5% পর্যন্ত ক্যাশব্যাক",
        slug: "up-to-2-5-percent-losing-commission-on-all-other-games",
        image: "/assets/promotions/promo-losing-commission-all-games-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "অন্যান্য সমস্ত গেমের জন্য একটি সুরক্ষা জাল, সাপ্তাহিক ক্ষতিতে 2.5% পর্যন্ত কমিশন।",
        seo_title: "BoroJeet ক্যাশব্যাক | অন্যান্য গেমে 2.5% পর্যন্ত",
        seo_description: "টেবিল গেম, আর্কেড বা কার্ড গেমে ক্ষতির বিষয়ে চিন্তা করবেন না। BoroJeet আপনাকে আরও একটি সুযোগ দেওয়ার জন্য 2.5% পর্যন্ত সাপ্তাহিক ক্যাশব্যাক অফার করে।",
        rules: [
          "Game Kind: Table, Arcade, Card, Lottery, Cockfighting, Others",
          "Commission Rate: Varies from 0.6% to 2.5% based on VIP level and weekly loss.",
          "Minimum Bonus: 1 BDT",
          "Maximum Bonus: Unlimited",
          "Turnover: 1x",
          "Release Time: 12:00 PM every Monday"
        ]
      }
    ]
  },
  {
    category: "🤝 Referral Program",
    date: "2025-11-14",
    slug: "referral",
    description: "Invite friends and earn rewards together! The more you refer, the more you earn.",
    items: [
      {
        title: "৳400 রেফারেল বোনাস: বন্ধুদের আমন্ত্রণ জানান এবং পুরস্কার জিতুন",
        slug: "400-referral-bonus-invite-friends-earn-rewards",
        image: "/assets/promotions/promo-referral-bonus-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "আপনি যখন আপনার বন্ধুকে BoroJeet-এ রেফার করবেন তখন আপনি এবং আপনার বন্ধু উভয়েই একটি বোনাস অর্জন করতে পারেন।",
        seo_title: "BoroJeet রেফারেল বোনাস | বন্ধুদের আমন্ত্রণ জানান এবং ৳400 জিতুন",
        seo_description: "আপনার বন্ধুদের BoroJeet-এ আমন্ত্রণ জানান এবং আপনারা উভয়েই পুরস্কৃত হন! প্রতিটি সফল রেফারেলে 400 টাকা পর্যন্ত আয় করুন। এখনই শেয়ার করা শুরু করুন!",
        rules: [
          "Total Bonus: Up to 400 BDT (200 for referrer, 200 for new member).",
          "Turnover: 3x for both.",
          "Referrer Eligibility: VIP 2+ with 1,000 BDT total deposit.",
          "New Member Condition: Deposit 1,000 BDT and make 20,000 BDT turnover within 7 days."
        ]
      },
      {
        title: "9,600 রেফারেল চ্যালেঞ্জ: আমন্ত্রণের জন্য মাসিক বোনাস",
        slug: "9600-referral-challenge-monthly-bonuses",
        image: "/assets/promotions/promo-referral-challenge-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "আপনি প্রতি মাসে যত বেশি বন্ধুকে রেফার করবেন, তত বড় বোনাস পেতে পারেন, 9,600 টাকা পর্যন্ত।",
        seo_title: "BoroJeet রেফারেল চ্যালেঞ্জ | মাসিক ৳9,600 পর্যন্ত আয় করুন",
        seo_description: "BoroJeet রেফারেল চ্যালেঞ্জ গ্রহণ করুন! বন্ধুদের আমন্ত্রণ জানান এবং 9,600 টাকা পর্যন্ত মাসিক বোনাস আয় করুন। আপনি যত বেশি রেফার করবেন, তত বেশি আয় করবেন।",
        rules: [
          "Challenge: Earn bonuses for successfully referring 5, 10, 20, 50, or 100 people monthly.",
          "Total Possible Bonus: Up to 9,600 BDT per month.",
          "Bonus Turnover: 3x"
        ]
      },
      {
        title: "অ্যাফিলিয়েট পার্টনার: 50% পর্যন্ত কমিশন উপার্জন করুন",
        slug: "affiliate-partner-earn-up-to-50-percent-commission",
        image: "/assets/promotions/promo-affiliate-commission-optimized.webp",
        startDate: "2025-06-27",
        endDate: "2030-06-30",
        details: "আমাদের অ্যাফিলিয়েট প্রোগ্রামে যোগ দিন এবং 50% পর্যন্ত উচ্চ কমিশন রেট অর্জন করুন।",
        seo_title: "BoroJeet অ্যাফিলিয়েট প্রোগ্রাম | 50% পর্যন্ত কমিশন উপার্জন করুন",
        seo_description: "একজন BoroJeet অ্যাফিলিয়েট পার্টনার হন এবং 50% পর্যন্ত কমিশন উপার্জন করুন। একটি বিশ্বস্ত ব্র্যান্ড প্রচার করুন এবং আপনার ট্র্যাফিকের উপর উচ্চ রিটার্ন পান।",
        rules: [
          "Plan A: 40% Fixed Commission on Slot, Fisher, and Crash games.",
          "Plan B: Tiered Commission up to 50% on all games, based on active members and net profit.",
          "Requirement: Minimum of 5 active members."
        ]
      }
    ]
  },
  {
    category: "🏆 Tournaments",
    date: "2025-11-14",
    slug: "tournament",
    description: "Compete with other players in our exciting tournaments and win big prizes!",
    items: [
      {
        title: "ড্রাগন ও টাইগার স্লট টুর্নামেন্ট",
        slug: "dragon-tiger-slot-tournament",
        image: "/assets/promotions/promo-dragon-tiger-tournament-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "দৈনিক, সাপ্তাহিক এবং মাসিক পুরস্কারের জন্য আমাদের ড্রাগন ও টাইগার লিডারবোর্ডে প্রতিযোগিতা করুন।",
        seo_title: "BoroJeet ড্রাগন ও টাইগার স্লট টুর্নামেন্ট | বড় পুরস্কার জিতুন",
        seo_description: "BoroJeet-এ ড্রাগন ও টাইগার স্লট টুর্নামেন্টে যোগ দিন। 9,600 টাকা পর্যন্ত দৈনিক, সাপ্তাহিক এবং মাসিক পুরস্কারের জন্য আমাদের লিডারবোর্ডে প্রতিযোগিতা করুন।",
        rules: [
          "Dragon Leaderboard: Qualify by winning 1,000+ BDT in a single round. Prizes up to 9,600 BDT.",
          "Tiger Leaderboard: Qualify by achieving a 200x+ multiplier. Prizes up to 6,400 BDT.",
          "Eligible Games: Slots from FC, JDB, JILI, PG, PP, PT, RT, VP, YB.",
          "Bonus Turnover: 1x"
        ]
      },
      {
        title: "অল স্লট বেটিং টুর্নামেন্ট",
        slug: "all-slot-betting-tournament",
        image: "/assets/promotions/promo-all-slot-tournament-optimized.webp",
        startDate: "2025-11-01",
        endDate: "2025-11-15",
        details: "যেকোনো স্লট গেমে সর্বোচ্চ মোট বৈধ টার্নওভার অর্জন করে লিডারবোর্ডে উঠুন।",
        seo_title: "BoroJeet অল স্লট বেটিং টুর্নামেন্ট | ৳5,000 BDT জিতুন",
        seo_description: "BoroJeet-এ অল স্লট বেটিং টুর্নামেন্টে অংশগ্রহণ করুন। সর্বোচ্চ টার্নওভার সহ খেলোয়াড় 5,000 BDT জিতবেন। শীর্ষ 1,000 খেলোয়াড়দের জন্য পুরস্কার।",
        rules: [
          "How to Win: Highest total valid turnover on any slot game.",
          "Minimum Requirement: 1,000 BDT total valid turnover.",
          "Prizes: Rank #1 gets 5,000 BDT. Prizes for top 1,000 players.",
          "Bonus Turnover: 1x"
        ]
      }
    ]
  }
];

// Flatten the promotions for easier access in collections
const flatPromotions = promotions.flatMap(category => 
  category.items.map(item => ({
    ...item,
    category: {
      name: category.category,
      slug: category.slug,
      description: category.description
    }
  }))
);

module.exports = {
  all: promotions,
  flat: flatPromotions
};

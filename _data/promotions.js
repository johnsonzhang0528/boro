const slugify = require("@sindresorhus/slugify");

const promotions = [
  {
    category: "🎁 Newbie Offers",
    slug: "newbie",
    description: "Exclusive offers for new players joining BoroJeet.",
    items: [
      {
        title: "Registration Bonus: Get up to 300 Free!",
        slug: "registration-bonus-get-up-to-300-free",
        image: "/assets/promotions/promo-registration-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "Choose one of the three registration bonus plans. Only one can be claimed.",
        seo_title: "BoroJeet Registration Bonus | Get up to 300 Free!",
        seo_description: "Sign up with BoroJeet and get a registration bonus of up to 300! Choose from three exclusive plans to start your gaming journey.",
        rules: [
          "Plan 1 (Bonus 300): Total Deposit: 300 | Max Withdraw: 300 | Turnover: 20x",
          "Plan 2 (Bonus 200): Total Deposit: 100 | Max Withdraw: 200 | Turnover: 25x",
          "Plan 3 (Bonus 100, App Only): Max Withdraw: 100 | Turnover: 30x | Game Kind: Slots",
          "Join Amount: Not Required",
          "Eligible Players: VIP 2 to VIP 5",
          "Availability: Once per Player",
          "Applicable Games (Plan 1 & 2): Slots & Crash Games",
          "Game Platforms: All Game Platforms"
        ]
      },
      {
        title: "Welcome to BoroJeet: Get 400% Bonus!",
        slug: "welcome-to-borojeet-get-400-percent-bonus",
        image: "/assets/promotions/promo-welcome-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "A massive 400% bonus to welcome you to the BoroJeet family.",
        seo_title: "BoroJeet Welcome Bonus | Get a 400% Boost!",
        seo_description: "New to BoroJeet? Claim your 400% welcome bonus and start playing with a massive advantage. Deposit 100 and get started now!",
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
        title: "Welcome Crash Bonus: Up to 100%!",
        slug: "welcome-crash-bonus-up-to-100-percent",
        image: "/assets/promotions/promo-welcome-crash-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "Get a 100% bonus specifically for our exciting Crash games.",
        seo_title: "BoroJeet Crash Game Bonus | 100% Welcome Offer",
        seo_description: "Love crash games? Get a 100% welcome bonus at BoroJeet. Deposit 200 and double your chances to win big in games like Aviator.",
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
        title: "Welcome Fisher Bonus: Up to 200%!",
        slug: "welcome-fisher-bonus-up-to-200-percent",
        image: "/assets/promotions/promo-welcome-fisher-optimized.webp",
        startDate: "2025-08-04",
        endDate: "2031-08-04",
        details: "A special 200% bonus for all fishing game enthusiasts.",
        seo_title: "BoroJeet Fishing Game Bonus | 200% Welcome Offer",
        seo_description: "Are you a fan of fishing games? Claim a 200% welcome bonus at BoroJeet. Deposit 300 and start your fishing adventure with a huge boost.",
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
        title: "Welcome Slot Bonus: Up to 300%!",
        slug: "welcome-slot-bonus-up-to-300-percent",
        image: "/assets/promotions/promo-welcome-slot-optimized.webp",
        startDate: "2025-08-04",
        endDate: "2031-08-05",
        details: "Enjoy a 300% bonus on a wide variety of slot games.",
        seo_title: "BoroJeet Slot Game Bonus | 300% Welcome Offer",
        seo_description: "Spin and win with a 300% welcome bonus on slot games at BoroJeet. Deposit 300 and get a massive boost to play your favorite slots.",
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
        title: "Application Bonus: Claim up to 150 Free!",
        slug: "application-bonus-claim-up-to-150-free",
        image: "/assets/promotions/promo-app-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "Choose one of three exclusive bonus plans available only on our app.",
        seo_title: "BoroJeet App Bonus | Claim up to 150 Free",
        seo_description: "Download the BoroJeet app and claim an exclusive bonus of up to 150. Special offers available only for app users.",
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
    slug: "special",
    description: "Limited-time offers for special events and holidays.",
    items: [
      {
        title: "300% Happy Weekend Bonus",
        slug: "300-percent-happy-weekend-bonus",
        image: "/assets/promotions/promo-weekend-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "Make your weekends happier with a massive 300% bonus.",
        seo_title: "BoroJeet Weekend Bonus | Get a 300% Boost!",
        seo_description: "Enjoy your weekend with a 300% bonus at BoroJeet. Deposit 300 on Saturday or Sunday and get 900 extra to play slots and fisher games.",
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
        title: "Payday Boost: Win up to 3,000 on All Games!",
        slug: "payday-boost-win-up-to-3000",
        image: "/assets/promotions/promo-payday-boost-optimized.webp",
        startDate: "2025-11-01",
        endDate: "2030-12-31",
        details: "Get a boost on payday and win up to 3,000 across all games.",
        seo_title: "BoroJeet Payday Boost | Win up to 3,000",
        seo_description: "Celebrate payday with BoroJeet! Deposit 200 on the 1st or 15th of the month for a chance to win up to 3,000 on slots and fisher games.",
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
        title: "Happy Birthday Bonus: Get up to 6,000!",
        slug: "happy-birthday-bonus-get-up-to-6000",
        image: "/assets/promotions/promo-birthday-bonus-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Celebrate your birthday with a special bonus from us, worth up to 6,000!",
        seo_title: "BoroJeet Birthday Bonus | Get up to 6,000 Free",
        seo_description: "Happy Birthday from BoroJeet! Claim a special birthday bonus of up to 6,000 during your birth month. The higher your VIP level, the bigger the bonus.",
        rules: [
          "Availability: Once per Year, on your birth month.",
          "Claim Time: Claim from Bonus Notification after 12:00 PM on the 15th of your birth month.",
          "Main Bonus (VIP 2-20): From 50 to 1,000 based on VIP level.",
          "Extra Bonus (VIP 2-20): From 550 to 6,000 based on total deposit.",
          "Wagering: 1x to 3x, depending on VIP level."
        ]
      },
      {
        title: "Deposit Boost: 0.5% to 3% Bonus!",
        slug: "deposit-boost-bonus",
        image: "/assets/promotions/promo-deposit-boost-optimized.webp",
        startDate: "2025-10-05",
        endDate: "2030-12-31",
        details: "Get a bonus of 0.5% to 3% on your deposits during special periods.",
        seo_title: "BoroJeet Deposit Boost | Get 0.5% to 3% Extra",
        seo_description: "Boost your deposits at BoroJeet! Get an extra 0.5% to 3% bonus on deposits made during our special promotion days. Unlimited bonus potential!",
        rules: [
          "Bonus Rate: 0.5% to 3%",
          "Maximum Bonus: Unlimited",
          "Minimum Deposit: 100",
          "Turnover: 3x",
          "Availability: 1st & 3rd Sunday, Monday, and Tuesday of every month."
        ]
      }
    ]
  },
  {
    category: "☀️ Daily Offers",
    slug: "daily",
    description: "Get new bonuses and rewards every day.",
    items: [
      {
        title: "Daily Bonus: Free ৳200",
        slug: "daily-bonus-free-200",
        image: "/assets/promotions/promo-daily-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "Claim a free ৳200 bonus every single day.",
        seo_title: "BoroJeet Daily Bonus | Claim a Free ৳200 Every Day",
        seo_description: "Log in to BoroJeet and claim your free ৳200 daily bonus! Deposit 300 today and enjoy extra funds for slots and card games.",
        rules: [
          "Bonus: ৳200",
          "Max Withdraw: ৳200",
          "Turnover: 30x",
          "Condition: Today's Deposit: 300",
          "Game Kind: Slots & Card",
          "Availability: Once per Day"
        ]
      },
      {
        title: "App Daily Wins 200%",
        slug: "app-daily-wins-200-percent",
        image: "/assets/promotions/promo-app-daily-wins-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "Win up to 200% daily, exclusively on the BoroJeet app.",
        seo_title: "BoroJeet App Daily Wins | Get a 200% Bonus",
        seo_description: "Use the BoroJeet app to get a 200% daily bonus. Deposit just ৳50 and win up to ৳200 on slots, fisher, and crash games.",
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
        title: "100% Daily Slot Bonus",
        slug: "100-percent-daily-slot-bonus",
        image: "/assets/promotions/promo-daily-slot-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "A daily 100% bonus to boost your slot game adventures.",
        seo_title: "BoroJeet Daily Slot Bonus | 100% Match Bonus",
        seo_description: "Get a 100% match bonus every day for slot games at BoroJeet. Deposit 200 and play with 400 to increase your winning chances.",
        rules: [
          "Bonus: ৳200",
          "Join Amount: ৳200",
          "Max Withdraw: ৳1,000",
          "Turnover: 20x",
          "Condition: Today's Deposit: 200",
          "Game Kind: Slot"
        ]
      },
      {
        title: "100% Daily Fisher Bonus",
        slug: "100-percent-daily-fisher-bonus",
        image: "/assets/promotions/promo-daily-fisher-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "Hook a big win with a 100% daily bonus for fishing games.",
        seo_title: "BoroJeet Daily Fisher Bonus | 100% Match Bonus",
        seo_description: "Love fishing games? Get a 100% daily bonus at BoroJeet. Deposit 200 and get an extra 200 to hunt for the biggest fish.",
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
        title: "100% Daily Crash Bonus",
        slug: "100-percent-daily-crash-bonus",
        image: "/assets/promotions/promo-daily-crash-bonus-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "Get a 100% bonus every day for our thrilling Crash games.",
        seo_title: "BoroJeet Daily Crash Bonus | 100% Match Bonus",
        seo_description: "Enjoy our exciting crash games with a 100% daily bonus. Deposit 200 and play with 400 for a better chance at high multipliers.",
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
        title: "Daily Slots & Crash Bonus: Win up to 1,000!",
        slug: "daily-slots-crash-bonus-win-1000",
        image: "/assets/promotions/promo-win-1000-daily-optimized.webp",
        startDate: "2025-05-27",
        endDate: "2030-12-31",
        details: "Play Slots & Crash games for a chance to win up to 1,000 daily.",
        seo_title: "BoroJeet Daily Bonus | Win up to 1,000 on Slots & Crash",
        seo_description: "Deposit 100 daily and play slots or crash games for a chance to turn it into 1,000! No turnover required on your winnings.",
        rules: [
          "Bonus: 100",
          "Join Amount: 100",
          "Max Withdraw: 1,000",
          "Turnover: Not Required",
          "Condition: Daily Deposit of 100",
          "How to Win?: Play until promotional wallet reaches 1,000"
        ]
      },
      {
        title: "99,999 Lucky Draw: Spin & Win Big",
        slug: "99999-lucky-draw-spin-win-big",
        image: "/assets/promotions/promo-lucky-draw-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Participate in our lucky draw for a chance to win up to 99,999!",
        seo_title: "BoroJeet 99,999 Lucky Draw | Spin and Win Daily",
        seo_description: "Join the BoroJeet lucky draw! Deposit 1,000 and meet turnover requirements for a chance to win up to 99,999 BDT daily.",
        rules: [
          "Turnover: 1x",
          "Availability: Once per Day",
          "Condition: Deposit 1,000 and valid turnover of 10,000 on the same day.",
          "Game Kind: Slot & Fisher & Crash",
          "Prizes: Vary by VIP level, up to 99,999."
        ]
      },
      {
        title: "300 Login Draw: Just Login & Win Points",
        slug: "300-login-draw-win-points",
        image: "/assets/promotions/promo-login-draw-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Simply log in every day for a chance to win up to 300 points.",
        seo_title: "BoroJeet Login Draw | Win Up to 300 Points Daily",
        seo_description: "Log in to BoroJeet daily and get a chance to win up to 300 free points. No deposit or turnover required. Just log in and win!",
        rules: [
          "Eligible Players: VIP Level 2 to VIP 20",
          "Availability: Once per day.",
          "Rewards: Randomly draw 50, 100, 150, 200, 250, or 300 points.",
          "Note: No deposit or turnover required."
        ]
      },
      {
        title: "7-Day Check-In Challenge: Rewards Every Day!",
        slug: "7-day-check-in-challenge",
        image: "/assets/promotions/promo-check-in-challenge-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Complete daily tasks for 7 consecutive days to claim increasing rewards.",
        seo_title: "BoroJeet 7-Day Check-In Challenge | Daily Rewards",
        seo_description: "Take the BoroJeet 7-day check-in challenge! Deposit 200 and meet turnover goals daily to earn increasing rewards every day for a week.",
        rules: [
          "Daily Task: Deposit 200 BDT & achieve 1,000 BDT valid turnover.",
          "Rewards: Increase daily from 1 BDT to 50 BDT on Day 7.",
          "Total Reward: Up to 119 BDT for 7 consecutive days.",
          "Bonus Turnover: 1x"
        ]
      },
      {
        title: "0.5% Bonus on Every Deposit",
        slug: "0-5-percent-bonus-on-every-deposit",
        image: "/assets/promotions/promo-deposit-reward-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Get an extra 0.5% bonus on every single deposit you make.",
        seo_title: "BoroJeet Deposit Bonus | Get 0.5% Extra on Every Deposit",
        seo_description: "Receive a 0.5% bonus on every deposit you make at BoroJeet. No limits on the bonus amount. Deposit 100 or more to qualify.",
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
    slug: "vip",
    description: "Exclusive rewards for our loyal players.",
    items: [
      {
        title: "100 Taka Free Weekly Facebook Share",
        slug: "100-taka-free-weekly-facebook-share",
        image: "/assets/promotions/promo-weekly-facebook-share-optimized.webp",
        startDate: "2025-07-31",
        endDate: "2030-12-31",
        details: "Share on Facebook weekly and get 100 Taka for free.",
        seo_title: "BoroJeet Facebook Share Bonus | Get 100 Taka Free Weekly",
        seo_description: "Share BoroJeet on your Facebook and get a 100 Taka bonus every week. Available for VIP 5+ members with a weekly deposit of 300.",
        rules: [
          "Bonus: ৳100",
          "Turnover: 1x",
          "Condition: Weekly Total Deposit: 300",
          "Eligible Player: VIP 5 and above",
          "Note: Your Facebook share must be publicly visible for review."
        ]
      },
      {
        title: "Monthly VIP Bonus: Earn Up to 4,000",
        slug: "monthly-vip-bonus-earn-up-to-4000",
        image: "/assets/promotions/promo-monthly-vip-bonus-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Loyal VIPs can earn a monthly bonus of up to 4,000.",
        seo_title: "BoroJeet Monthly VIP Bonus | Earn Up to 4,000",
        seo_description: "As a loyal VIP at BoroJeet, you can earn a monthly bonus of up to 4,000. Maintain your activity and get rewarded on the 1st of each month.",
        rules: [
          "Bonus: 200 to 4,000, based on VIP level.",
          "Requirement: Varies by VIP level (e.g., VIP 2-4 needs 500 deposit & 40,000 turnover).",
          "Turnover Requirement: 3x",
          "Monthly Requirement: Minimum of 14 deposits and 7 logins.",
          "Distribution: 12:00 PM on the 1st of the following month."
        ]
      },
      {
        title: "Weekly VIP Bonus: Get up to 2,000",
        slug: "weekly-vip-bonus-get-up-to-2000",
        image: "/assets/promotions/promo-weekly-vip-bonus-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "A weekly bonus for our VIP players, with rewards up to 2,000.",
        seo_title: "BoroJeet Weekly VIP Bonus | Get up to 2,000",
        seo_description: "Get rewarded every week at BoroJeet with our VIP bonus. Earn up to 2,000 based on your VIP level and weekly activity. Bonuses are paid out every Friday.",
        rules: [
          "Bonus: 100 to 2,000, based on VIP level.",
          "Requirement: Varies by VIP level (e.g., VIP 2-4 needs 250 deposit & 20,000 turnover).",
          "Turnover Requirement: 3x",
          "Weekly Requirement: Minimum of 5 deposits during the activity period (Fri-Thu).",
          "Distribution: 12:00 PM every Friday."
        ]
      },
      {
        title: "VIP Upgrade Bonus: Get up to 6,000",
        slug: "vip-upgrade-bonus-get-up-to-6000",
        image: "/assets/promotions/promo-vip-upgrade-bonus-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Receive a bonus up to 6,000 every time you upgrade your VIP level.",
        seo_title: "BoroJeet VIP Upgrade Bonus | Get up to 6,000",
        seo_description: "Level up your VIP status at BoroJeet and get an instant bonus of up to 6,000. The higher you climb, the bigger the reward.",
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
    slug: "rebate",
    description: "Get daily rebates on your turnover. The more you play, the more you get back!",
    items: [
      {
        title: "1.5% Daily Rebate on Slot & Fisher",
        slug: "1-5-percent-daily-rebate-on-slot-fisher",
        image: "/assets/promotions/promo-daily-rebate-slot-fisher-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Earn up to 1.5% daily rebate on your turnover in Slot and Fisher games.",
        seo_title: "BoroJeet Daily Rebate | 1.5% on Slot & Fisher Games",
        seo_description: "Play slot and fisher games at BoroJeet and get a daily rebate of up to 1.5% on your turnover. The more you play, the more you earn back!",
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
        title: "1.0% Daily Rebate on Crash, Live & Sports",
        slug: "1-0-percent-daily-rebate-on-crash-live-sports",
        image: "/assets/promotions/promo-daily-rebate-crash-live-sport-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Get up to 1.0% daily rebate on Crash, Live Casino, and Sports betting.",
        seo_title: "BoroJeet Daily Rebate | 1.0% on Crash, Live & Sports",
        seo_description: "Get a daily rebate of up to 1.0% on your turnover from crash games, live casino, and sports betting at BoroJeet. Unlimited bonus potential!",
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
        title: "0.9% Daily Rebate on All Other Games",
        slug: "0-9-percent-daily-rebate-on-all-other-games",
        image: "/assets/promotions/promo-daily-rebate-all-games-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Enjoy up to 0.9% daily rebate on Table games, Arcade, Card games, and more.",
        seo_title: "BoroJeet Daily Rebate | 0.9% on Table, Arcade & Card Games",
        seo_description: "Play a wide variety of games at BoroJeet and earn a daily rebate of up to 0.9%. Includes table games, arcade, card games, and more.",
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
    slug: "cashback",
    description: "Get a percentage of your losses back. A safety net for our players.",
    items: [
      {
        title: "Up to 8% Losing Commission on Slot & Fisher",
        slug: "up-to-8-percent-losing-commission-on-slot-fisher",
        image: "/assets/promotions/promo-losing-commission-slot-fisher-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Get back up to 8% of your weekly losses in Slot and Fisher games.",
        seo_title: "BoroJeet Losing Commission | Up to 8% on Slot & Fisher",
        seo_description: "Had a bad week? Get up to 8% of your losses back on slot and fisher games at BoroJeet. Commission is paid out every Monday.",
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
        title: "Up to 5% Losing Commission on Crash, Live & Sports",
        slug: "up-to-5-percent-losing-commission-on-crash-live-sports",
        image: "/assets/promotions/promo-losing-commission-crash-live-sports-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Receive up to 5% cashback on your weekly losses in Crash, Live Casino, and Sports.",
        seo_title: "BoroJeet Losing Commission | Up to 5% on Crash, Live & Sports",
        seo_description: "Get a safety net with up to 5% losing commission on crash, live casino, and sports betting at BoroJeet. Cashback is credited every Monday.",
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
        title: "Up to 2.5% Losing Commission on All Other Games",
        slug: "up-to-2-5-percent-losing-commission-on-all-other-games",
        image: "/assets/promotions/promo-losing-commission-all-games-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "A safety net for all other games, with up to 2.5% commission on weekly losses.",
        seo_title: "BoroJeet Losing Commission | Up to 2.5% on Other Games",
        seo_description: "Don't worry about losses on table games, arcade, or card games. BoroJeet offers up to 2.5% weekly losing commission to give you another chance.",
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
    slug: "referral",
    description: "Invite friends and earn rewards together! The more you refer, the more you earn.",
    items: [
      {
        title: "৳400 Referral Bonus: Invite Friends & Earn Rewards",
        slug: "400-referral-bonus-invite-friends-earn-rewards",
        image: "/assets/promotions/promo-referral-bonus-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Both you and your friend can earn a bonus when you refer them to BoroJeet.",
        seo_title: "BoroJeet Referral Bonus | Invite Friends & Earn ৳400",
        seo_description: "Invite your friends to BoroJeet and you both get rewarded! Earn up to 400 BDT for every successful referral. Start sharing now!",
        rules: [
          "Total Bonus: Up to 400 BDT (200 for referrer, 200 for new member).",
          "Turnover: 3x for both.",
          "Referrer Eligibility: VIP 2+ with 1,000 BDT total deposit.",
          "New Member Condition: Deposit 1,000 BDT and make 20,000 BDT turnover within 7 days."
        ]
      },
      {
        title: "9,600 Referral Challenge: Monthly Bonuses for Invites",
        slug: "9600-referral-challenge-monthly-bonuses",
        image: "/assets/promotions/promo-referral-challenge-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "The more friends you refer each month, the bigger the bonus you can get, up to 9,600 BDT.",
        seo_title: "BoroJeet Referral Challenge | Earn up to 9,600 Monthly",
        seo_description: "Take the BoroJeet referral challenge! Invite friends and earn monthly bonuses up to 9,600 BDT. The more you refer, the more you earn.",
        rules: [
          "Challenge: Earn bonuses for successfully referring 5, 10, 20, 50, or 100 people monthly.",
          "Total Possible Bonus: Up to 9,600 BDT per month.",
          "Bonus Turnover: 3x"
        ]
      },
      {
        title: "Affiliate Partner: Earn up to 50% Commission",
        slug: "affiliate-partner-earn-up-to-50-percent-commission",
        image: "/assets/promotions/promo-affiliate-commission-optimized.webp",
        startDate: "2025-06-27",
        endDate: "2030-06-30",
        details: "Join our affiliate program and earn a high commission rate of up to 50%.",
        seo_title: "BoroJeet Affiliate Program | Earn up to 50% Commission",
        seo_description: "Become a BoroJeet affiliate partner and earn up to 50% commission. Promote a trusted brand and get high returns on your traffic.",
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
    slug: "tournament",
    description: "Compete with other players in our exciting tournaments and win big prizes!",
    items: [
      {
        title: "Dragon & Tiger Slot Tournament",
        slug: "dragon-tiger-slot-tournament",
        image: "/assets/promotions/promo-dragon-tiger-tournament-optimized.webp",
        startDate: "2025-06-08",
        endDate: "2030-12-31",
        details: "Compete in our Dragon & Tiger leaderboards for daily, weekly, and monthly prizes.",
        seo_title: "BoroJeet Dragon & Tiger Slot Tournament | Win Big Prizes",
        seo_description: "Join the Dragon & Tiger slot tournament at BoroJeet. Compete on our leaderboards for daily, weekly, and monthly prizes up to 9,600 BDT.",
        rules: [
          "Dragon Leaderboard: Qualify by winning 1,000+ BDT in a single round. Prizes up to 9,600 BDT.",
          "Tiger Leaderboard: Qualify by achieving a 200x+ multiplier. Prizes up to 6,400 BDT.",
          "Eligible Games: Slots from FC, JDB, JILI, PG, PP, PT, RT, VP, YB.",
          "Bonus Turnover: 1x"
        ]
      },
      {
        title: "All Slot Betting Tournament",
        slug: "all-slot-betting-tournament",
        image: "/assets/promotions/promo-all-slot-tournament-optimized.webp",
        startDate: "2025-11-01",
        endDate: "2025-11-15",
        details: "Climb the leaderboard by achieving the highest total valid turnover in any slot game.",
        seo_title: "BoroJeet All Slot Betting Tournament | Win 5,000 BDT",
        seo_description: "Participate in the All Slot Betting Tournament at BoroJeet. The player with the highest turnover wins 5,000 BDT. Prizes for the top 1,000 players.",
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

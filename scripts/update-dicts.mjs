import fs from 'fs';
import path from 'path';

const enPath = path.resolve('src/i18n/en.json');
const bnPath = path.resolve('src/i18n/bn.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const bn = JSON.parse(fs.readFileSync(bnPath, 'utf-8'));

const directoryEn = {
  title: "Fests & Events",
  subtitle: "Explore and register for upcoming events.",
  featuredFests: "Featured Fests",
  searchPlaceholder: "Search events by title or description...",
  category: "Category",
  status: "Status",
  time: "Time",
  sort: "Sort by",
  clearFilters: "Clear Filters",
  loadMore: "Load More",
  noEventsFound: "No events found",
  noEventsFoundDesc: "Try adjusting your search or filters.",
  loading: "Loading...",
  seatsLeft: "{{count}} seats left",
  teamEvent: "Team Event",
  individualEvent: "Individual Event",
  starts: "Starts",
  ends: "Ends",
  deadline: "Deadline",
  states: {
    open: "Open",
    closing_soon: "Closing Soon",
    waitlist: "Waitlist",
    full: "Full",
    closed: "Closed",
    ended: "Ended",
    cancelled: "Cancelled",
    not_open: "Coming Soon"
  },
  categories: {
    all: "All Categories",
    programming: "Programming",
    ai_ml: "AI & ML",
    web_dev: "Web Development",
    robotics: "Robotics",
    gaming: "Gaming",
    workshop: "Workshop",
    quiz: "Quiz",
    hackathon: "Hackathon",
    other: "Other"
  },
  timeFilters: {
    all: "All Time",
    upcoming: "Upcoming",
    past: "Past"
  },
  sortOptions: {
    soonest: "Starting Soonest",
    deadline: "Deadline Closing Soonest",
    seats: "Most Seats Available"
  }
};

const directoryBn = {
  title: "ফেস্ট এবং ইভেন্ট",
  subtitle: "আসন্ন ইভেন্টগুলো খুঁজুন এবং রেজিস্ট্রেশন করুন।",
  featuredFests: "ফিচার্ড ফেস্ট",
  searchPlaceholder: "শিরোনাম বা বিবরণ দিয়ে ইভেন্ট খুঁজুন...",
  category: "বিভাগ",
  status: "স্ট্যাটাস",
  time: "সময়",
  sort: "সাজান",
  clearFilters: "ফিল্টার মুছুন",
  loadMore: "আরও লোড করুন",
  noEventsFound: "কোনো ইভেন্ট পাওয়া যায়নি",
  noEventsFoundDesc: "আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করে দেখুন।",
  loading: "লোড হচ্ছে...",
  seatsLeft: "{{count}} টি সিট বাকি",
  teamEvent: "দলগত ইভেন্ট",
  individualEvent: "একক ইভেন্ট",
  starts: "শুরু",
  ends: "শেষ",
  deadline: "ডেডলাইন",
  states: {
    open: "উন্মুক্ত",
    closing_soon: "শীঘ্রই বন্ধ হচ্ছে",
    waitlist: "অপেক্ষমান",
    full: "পূর্ণ",
    closed: "বন্ধ",
    ended: "শেষ",
    cancelled: "বাতিল",
    not_open: "আসছে"
  },
  categories: {
    all: "সকল বিভাগ",
    programming: "প্রোগ্রামিং",
    ai_ml: "এআই এবং এমএল",
    web_dev: "ওয়েব ডেভেলপমেন্ট",
    robotics: "রোবোটিক্স",
    gaming: "গেমিং",
    workshop: "কর্মশালা",
    quiz: "কুইজ",
    hackathon: "হ্যাকথন",
    other: "অন্যান্য"
  },
  timeFilters: {
    all: "সব সময়",
    upcoming: "আসন্ন",
    past: "অতীত"
  },
  sortOptions: {
    soonest: "শীঘ্রই শুরু",
    deadline: "ডেডলাইন শেষ হচ্ছে",
    seats: "সর্বোচ্চ সিট খালি"
  }
};

en.directory = directoryEn;
bn.directory = directoryBn;

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf-8');
fs.writeFileSync(bnPath, JSON.stringify(bn, null, 2) + '\n', 'utf-8');

console.log('Dictionaries updated successfully.');


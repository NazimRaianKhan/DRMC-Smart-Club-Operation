import fs from 'fs';
import path from 'path';

const enPath = path.resolve('src/i18n/en.json');
const bnPath = path.resolve('src/i18n/bn.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const bn = JSON.parse(fs.readFileSync(bnPath, 'utf-8'));

if (!en.directory) en.directory = {};
if (!bn.directory) bn.directory = {};

// EventBrowser and EventCard keys
Object.assign(en.directory, {
  searchPlaceholder: "Search events by title or description...",
  allFests: "All Fests",
  sortSoonest: "Starting Soonest",
  sortDeadline: "Deadline Closing Soonest",
  sortSeats: "Most Seats Available",
  whenUpcoming: "Upcoming",
  whenPast: "Past",
  categoriesTitle: "Category",
  statesTitle: "Status",
  loading: "Loading...",
  resultsFound: "results found",
  noResults: "No events found",
  noResultsDesc: "Try adjusting your search or filters.",
  clearFilters: "Clear Filters",
  loadMore: "Load More",
  teamOf: "Team of",
  solo: "Individual Event",
  waitlistOpen: "Waitlist Open",
  full: "Full",
  seatsLeft: "seats left",
  dateTime: "Date & Time",
  venue: "Venue",
  participation: "Participation",
  seats: "Seats",
  registrationClosed: "Registration Closed",
  viewEvent: "View Event",
  statusOpen: "Open",
  statusClosingSoon: "Closing Soon",
  statusWaitlist: "Waitlist",
  statusFull: "Full",
  statusClosed: "Closed",
  statusEnded: "Ended",
  statusNotOpen: "Coming Soon",
  statusCancelled: "Cancelled",
  categories: {
    programming: "Programming",
    ai_ml: "AI & ML",
    web_dev: "Web Dev",
    robotics: "Robotics",
    gaming: "Gaming",
    workshop: "Workshop",
    quiz: "Quiz",
    hackathon: "Hackathon",
    other: "Other"
  },
  states: {
    open: "Open",
    closing_soon: "Closing Soon",
    waitlist: "Waitlist",
    full: "Full",
    closed: "Closed"
  }
});

Object.assign(bn.directory, {
  searchPlaceholder: "শিরোনাম বা বিবরণ দিয়ে খুঁজুন...",
  allFests: "সকল ফেস্ট",
  sortSoonest: "শীঘ্রই শুরু",
  sortDeadline: "ডেডলাইন শেষ হচ্ছে",
  sortSeats: "সর্বোচ্চ সিট খালি",
  whenUpcoming: "আসন্ন",
  whenPast: "অতীত",
  categoriesTitle: "বিভাগ",
  statesTitle: "স্ট্যাটাস",
  loading: "লোড হচ্ছে...",
  resultsFound: "টি পাওয়া গেছে",
  noResults: "কোনো ইভেন্ট পাওয়া যায়নি",
  noResultsDesc: "আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করে দেখুন।",
  clearFilters: "ফিল্টার মুছুন",
  loadMore: "আরও লোড করুন",
  teamOf: "দলগত",
  solo: "একক ইভেন্ট",
  waitlistOpen: "অপেক্ষমান",
  full: "পূর্ণ",
  seatsLeft: "টি সিট বাকি",
  dateTime: "তারিখ ও সময়",
  venue: "স্থান",
  participation: "অংশগ্রহণ",
  seats: "আসন",
  registrationClosed: "রেজিস্ট্রেশন বন্ধ",
  viewEvent: "ইভেন্ট দেখুন",
  statusOpen: "উন্মুক্ত",
  statusClosingSoon: "শীঘ্রই বন্ধ হচ্ছে",
  statusWaitlist: "অপেক্ষমান",
  statusFull: "পূর্ণ",
  statusClosed: "বন্ধ",
  statusEnded: "শেষ",
  statusNotOpen: "আসছে",
  statusCancelled: "বাতিল",
  categories: {
    programming: "প্রোগ্রামিং",
    ai_ml: "এআই এবং এমএল",
    web_dev: "ওয়েব ডেভ",
    robotics: "রোবোটিক্স",
    gaming: "গেমিং",
    workshop: "কর্মশালা",
    quiz: "কুইজ",
    hackathon: "হ্যাকথন",
    other: "অন্যান্য"
  },
  states: {
    open: "উন্মুক্ত",
    closing_soon: "শীঘ্রই বন্ধ হচ্ছে",
    waitlist: "অপেক্ষমান",
    full: "পূর্ণ",
    closed: "বন্ধ"
  }
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf-8');
fs.writeFileSync(bnPath, JSON.stringify(bn, null, 2) + '\n', 'utf-8');


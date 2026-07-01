import { type PollCardProps } from "@/components/PollCard";

const img = (seed: string, w = 600, h = 450) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

/** Sample polls rendered by the Trending feed. */
export const FEED_POLLS: PollCardProps[] = [
  {
    author: "CircuitDaily",
    authorColor: "#128c78",
    authorBadge: "TECH",
    postedAgo: "2h",
    location: "San Francisco, CA",
    categories: ["Technology", "Economics"],
    question: "What will change daily life more?",
    options: [
      { label: "Smarter devices", image: img("tech-devices"), votes: 10800 },
      { label: "Better software", image: img("tech-software"), votes: 2700 },
    ],
    tags: ["fintech", "automation", "future", "startups", "money"],
    likes: 1000,
    reposts: 532,
    votes: 13500,
    timeLeft: "2h",
  },
  {
    author: "FoodieWeekly",
    authorColor: "#e36133",
    authorBadge: "EATS",
    isFollowing: true,
    postedAgo: "5h",
    location: "Austin, TX",
    categories: ["Food", "Lifestyle"],
    question: "Pizza or tacos for the weekend?",
    options: [
      { label: "Pizza", image: img("food-pizza"), votes: 5400 },
      { label: "Tacos", image: img("food-tacos"), votes: 3920 },
    ],
    tags: ["food", "weekend", "cravings", "recipes"],
    likes: 842,
    reposts: 211,
    votes: 9320,
    timeLeft: "5h",
  },
  {
    author: "Wanderlust",
    authorColor: "#6161c7",
    authorBadge: "TRIP",
    postedAgo: "1d",
    location: "Denver, CO",
    categories: ["Travel", "Outdoors"],
    question: "Mountains or the ocean this summer?",
    options: [
      { label: "Mountains", image: img("travel-mountains"), votes: 4200 },
      { label: "Ocean", image: img("travel-ocean"), votes: 16800 },
    ],
    tags: ["travel", "summer", "nature", "adventure"],
    likes: 2300,
    reposts: 678,
    votes: 21000,
    timeLeft: "1d",
  },
  {
    author: "PawPrints",
    authorColor: "#f2ba1c",
    authorBadge: "PETS",
    postedAgo: "3h",
    location: "Portland, OR",
    categories: ["Pets", "Lifestyle"],
    question: "Which makes the better pet?",
    options: [
      { label: "Dogs", image: img("pets-dogs"), votes: 57210 },
      { label: "Cats", image: img("pets-cats"), votes: 31000 },
    ],
    tags: ["pets", "dogs", "cats", "animals"],
    likes: 15600,
    reposts: 1240,
    votes: 88210,
    timeLeft: "3h",
  },
];

// Shared defaults for landing page content. Used as fallback when a section is
// missing from the database. Structure mirrors what admins can edit under /admin.

export type SiteContent = Record<string, unknown>;

export const DEFAULT_CONTENT: Record<string, SiteContent> = {
  hero: {
    eyebrow: "Kaptai Lake · Rangamati",
    title_prefix: "Reconnect with nature at",
    title_italic: "Lake Leaf",
    title_suffix: "Nature Stay.",
    subtitle:
      "A private lakeside retreat for families and friends — accessible only by boat and surrounded by the serene waters of Kaptai Lake.",
    primary_cta: "Plan Your Stay",
    secondary_cta: "View Availability",
  },
  contact: {
    whatsapp_number: "8801000000000",
    whatsapp_message: "Hi Lake Leaf, I'd like to plan a stay.",
    location: "Kaptai Lake, Rangamati",
    brand: "Lake Leaf Nature Stay",
    tagline:
      "A private lakeside retreat on Kaptai Lake for families and friends who want to slow down.",
    footer_note: "Made with care in Bangladesh.",
  },
  journey: {
    eyebrow: "The Journey",
    title: "Every stay begins with a quiet boat ride.",
    body:
      "Leave the road behind. A short crossing over Kaptai Lake carries you to a private cove where the trees lean toward the water and the world grows still. By the time your boat touches the shore, the city already feels far away.",
    steps: [
      { label: "Drive to jetty" },
      { label: "Boat across lake" },
      { label: "Arrive at Lake Leaf" },
    ],
  },
  why_choose: {
    eyebrow: "Why Choose Lake Leaf",
    title: "A different kind of quiet.",
    cards: [
      { icon: "Users", title: "Entire property, just yours", body: "Enjoy complete privacy with your family or friends — no shared corridors, no neighbours." },
      { icon: "Sailboat", title: "Boat access only", body: "A short lake crossing is part of the experience. Arrival feels like an escape." },
      { icon: "Waves", title: "Surrounded by Kaptai Lake", body: "Wake to still water in every direction and long, quiet hours by the shore." },
      { icon: "Mountain", title: "Peaceful private setting", body: "No horns, no crowds. Only birdsong, breeze and the sound of paddles on water." },
      { icon: "Coffee", title: "Modern comforts in nature", body: "Warm beds, hot showers, a full kitchen — all wrapped in forest and lake views." },
      { icon: "Flame", title: "Cook in or be catered for", body: "Bring your own groceries and cook together, or ask the host to arrange meals." },
    ],
  },
  accommodation: {
    eyebrow: "The Stay",
    title: "Thoughtfully designed for families and small groups.",
    body:
      "A private home with three comfortable bedrooms, a warm living room, dining area and a fully equipped kitchen. Step out to the garden, the rooftop, or the water — it is all yours.",
    features: [
      { icon: "BedDouble", text: "3 bedrooms, double bed in each" },
      { icon: "Users", text: "Foldable extra beds on request" },
      { icon: "Utensils", text: "Living, dining & full kitchen" },
      { icon: "Sun", text: "Rooftop, garden & outdoor seating" },
    ],
  },
  amenities: {
    eyebrow: "Amenities",
    title: "Everything you need. Nothing you don't.",
    groups: [
      { title: "Stay Comfort", items: [{ icon: "Wind", label: "Air Conditioning" }, { icon: "Sun", label: "Ceiling Fans" }, { icon: "Wifi", label: "Wi-Fi" }, { icon: "BedDouble", label: "Fresh Linen" }] },
      { title: "Kitchen", items: [{ icon: "Refrigerator", label: "Refrigerator" }, { icon: "Microwave", label: "Microwave Oven" }, { icon: "Utensils", label: "Gas Stove" }, { icon: "WashingMachine", label: "Washing Machine" }] },
      { title: "Outdoor", items: [{ icon: "Trees", label: "Garden" }, { icon: "Sun", label: "Rooftop" }, { icon: "Coffee", label: "Outdoor Seating" }, { icon: "Car", label: "Parking (at jetty)" }] },
      { title: "Activities", items: [{ icon: "Sailboat", label: "Boat Rides" }, { icon: "Fish", label: "Fishing" }, { icon: "Waves", label: "Kayaking" }, { icon: "Camera", label: "Photography Spots" }] },
    ],
  },
  experiences: {
    eyebrow: "Experiences",
    title: "Slow days. Warm nights.",
    items: [
      { slot: "sunrise", title: "Sunrise on the water", body: "Warm cups, cool air and the first golden light spilling across the lake." },
      { slot: "kayak", title: "Kayaking & boat rides", body: "Paddle out through the coves or drift with a book on a slow ride." },
      { slot: "bbq", title: "BBQ evenings", body: "Grill by the water and gather around long tables under the trees." },
      { slot: "campfire", title: "Campfire nights", body: "Long conversations, marshmallows and a sky full of stars." },
    ],
  },
  gallery: {
    eyebrow: "Gallery",
    title: "Moments from the lake.",
    subtitle: "Exterior, bedrooms, rooftop, garden and long views of Kaptai Lake.",
  },
  nearby: {
    eyebrow: "Nearby",
    title: "Discover the beauty around you.",
    subtitle: "Simple day trips, all a short ride from the property.",
    spots: [
      { name: "Shuvolong Waterfall", desc: "A short boat ride to a cascading waterfall tucked into the hills." },
      { name: "Hanging Bridge, Rangamati", desc: "The iconic bridge over Kaptai Lake, minutes from the jetty." },
      { name: "Chit Mor'ong Buddhist Temple", desc: "A serene hilltop temple with sweeping lake views." },
      { name: "Furomon Hill", desc: "One of the highest viewpoints in Rangamati for a slow sunset climb." },
    ],
  },
  availability: {
    eyebrow: "Availability",
    title: "Check the calendar. Then message the host.",
    body:
      "Live availability is updated by the host. To confirm any date, please reach out on WhatsApp — every stay is arranged personally.",
    cta: "Ask about a date",
  },
  testimonials: {
    eyebrow: "Guest Notes",
    items: [
      { text: "It felt like our own private island. The boat ride in was pure magic.", who: "Rifat & family, Dhaka" },
      { text: "Quiet, clean, thoughtfully done. The rooftop at sunset is unforgettable.", who: "Sadia, Chattogram" },
      { text: "Best weekend with friends we've had in years. Campfire under a full sky.", who: "Tahmid + crew" },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Good things to know before you arrive.",
    items: [
      { q: "How do I reach the property?", a: "Drive to the designated jetty on Kaptai Lake, then take a short host-arranged boat ride to Lake Leaf. The full route is shared once dates are confirmed on WhatsApp." },
      { q: "Is the entire property private?", a: "Yes. Only one family or group stays at a time — the house, garden, rooftop and outdoor seating are entirely yours." },
      { q: "Is boat transportation available?", a: "Yes. The host arranges the boat pick-up and drop from the jetty as part of your stay." },
      { q: "Can we cook our own meals?", a: "Absolutely. The kitchen is fully equipped. You may also request catered meals in advance." },
      { q: "How many guests can stay?", a: "The three bedrooms comfortably host a family or small group. Foldable extra beds can be arranged on request." },
      { q: "Is it suitable for children?", a: "Yes — the property is private, quiet and family-friendly. Adult supervision is recommended near the water." },
    ],
  },
  contact_cta: {
    eyebrow: "Plan Your Stay",
    title: "Your peaceful escape on Kaptai Lake is one message away.",
    body: "Reach the host directly on WhatsApp to check dates, ask questions and arrange the boat.",
    cta: "Message on WhatsApp",
  },
};

export type SectionKey = keyof typeof DEFAULT_CONTENT;
export const SECTION_KEYS = Object.keys(DEFAULT_CONTENT) as SectionKey[];

export const SECTION_LABELS: Record<string, string> = {
  hero: "Hero (top banner)",
  contact: "Contact & WhatsApp",
  journey: "The Journey",
  why_choose: "Why Choose Lake Leaf",
  accommodation: "The Stay",
  amenities: "Amenities",
  experiences: "Experiences",
  gallery: "Gallery",
  nearby: "Nearby spots",
  availability: "Availability section",
  testimonials: "Guest Notes",
  faq: "FAQ",
  contact_cta: "Contact CTA (bottom)",
};

export const MEDIA_SLOTS = [
  { slot: "logo", label: "Brand logo (nav & footer)" },
  { slot: "hero", label: "Hero background" },
  { slot: "journey", label: "Journey (boat)" },
  { slot: "bedroom", label: "Bedroom" },
  { slot: "exterior", label: "Cottage exterior" },
  { slot: "rooftop", label: "Rooftop" },
  { slot: "sunrise", label: "Sunrise (experience)" },
  { slot: "kayak", label: "Kayak (experience)" },
  { slot: "bbq", label: "BBQ (experience)" },
  { slot: "campfire", label: "Campfire (experience)" },
] as const;

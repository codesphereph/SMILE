/* Shared data — generated from backend/Code.gs (categories, places, challenges, ranks, badges). */
window.SMILE_DATA = {
  categories: [
    { id: 'landmarks',   name: 'Landmarks',           icon: '📍', color: 'var(--c-landmarks)',   img: 'assets/cat-landmarks.jpg',   blurb: 'Heritage churches, plazas & museums' },
    { id: 'restaurants', name: 'Restaurants & Cafés', icon: '🍴', color: 'var(--c-restaurants)', img: 'assets/cat-restaurants.jpg', blurb: 'Batchoy, seafood & coffee' },
    { id: 'shops',       name: 'Shops',               icon: '🛍️', color: 'var(--c-shops)',       img: 'assets/cat-shops.jpg',       blurb: 'Pasalubong, hablon & crafts' },
    { id: 'events',      name: 'Events',              icon: '🎉', color: 'var(--c-events)',      img: 'assets/cat-events.jpg',      blurb: 'Dinagyang & Iloilo festivals' }
  ],
  points: {"landmarks":20,"restaurants":15,"shops":10,"events":25},
  photoPoints: 5,
  ranks: [
    {
      "id": "E",
      "name": "Class E",
      "minPoints": 0,
      "color": "#8A8F98",
      "title": "Newcomer"
    },
    {
      "id": "D",
      "name": "Class D",
      "minPoints": 100,
      "color": "#22A046",
      "title": "Wanderer"
    },
    {
      "id": "C",
      "name": "Class C",
      "minPoints": 250,
      "color": "#1D7FE0",
      "title": "Explorer"
    },
    {
      "id": "B",
      "name": "Class B",
      "minPoints": 450,
      "color": "#7B2FBE",
      "title": "Adventurer"
    },
    {
      "id": "A",
      "name": "Class A",
      "minPoints": 700,
      "color": "#F26A1B",
      "title": "Trailblazer"
    },
    {
      "id": "S",
      "name": "Class S",
      "minPoints": 1000,
      "color": "#E0263B",
      "title": "Iloilo Expert"
    },
    {
      "id": "SS",
      "name": "Class SS",
      "minPoints": 1500,
      "color": "#EC2882",
      "title": "Iloilo Legend"
    },
    {
      "id": "SSS",
      "name": "Class SSS",
      "minPoints": 2200,
      "color": "#FFB000",
      "title": "SMILE Ambassador"
    }
  ],
  challenges: [
    {
      "id": "heritage-trail",
      "name": "Heritage Trail",
      "icon": "⛪",
      "description": "Visit Molo Church, Jaro Cathedral, Calle Real and Museo Iloilo.",
      "type": "places",
      "target": "lm-molo,lm-jaro,lm-calle,lm-museo",
      "count": 4,
      "bonus": 100
    },
    {
      "id": "food-crawl",
      "name": "La Paz & Molo Food Crawl",
      "icon": "🍜",
      "description": "Batchoy, Madge coffee, Deocampo barquillos and Panaderia de Molo.",
      "type": "places",
      "target": "rs-batchoy,rs-madge,sh-deocampo,sh-molo",
      "count": 4,
      "bonus": 80
    },
    {
      "id": "miagao-day",
      "name": "Miag-ao Day Trip",
      "icon": "🧵",
      "description": "See Miag-ao Church and the hablon weavers.",
      "type": "places",
      "target": "lm-miagao,sh-hablon",
      "count": 2,
      "bonus": 80
    },
    {
      "id": "pasalubong-run",
      "name": "Pasalubong Run",
      "icon": "🛍️",
      "description": "Check in at any 3 shops.",
      "type": "category",
      "target": "shops",
      "count": 3,
      "bonus": 50
    },
    {
      "id": "festival-fan",
      "name": "Festival Fan",
      "icon": "🎉",
      "description": "Join 2 Iloilo events, like Dinagyang.",
      "type": "category",
      "target": "events",
      "count": 2,
      "bonus": 100
    },
    {
      "id": "snap-happy",
      "name": "Snap Happy",
      "icon": "📸",
      "description": "Take 5 SMILE photos at tagged places.",
      "type": "photos",
      "target": "",
      "count": 5,
      "bonus": 60
    },
    {
      "id": "city-explorer",
      "name": "City Explorer",
      "icon": "🧭",
      "description": "Visit 10 different places.",
      "type": "checkins",
      "target": "",
      "count": 10,
      "bonus": 150
    }
  ],
  badges: [
    {
      "id": "first-step",
      "name": "First Step",
      "icon": "👣",
      "desc": "Your first check-in"
    },
    {
      "id": "heritage-hunter",
      "name": "Heritage Hunter",
      "icon": "⛪",
      "desc": "Visit 3 landmarks"
    },
    {
      "id": "foodie",
      "name": "Ilonggo Foodie",
      "icon": "🍜",
      "desc": "Check in at 3 restaurants or cafés"
    },
    {
      "id": "pasalubong-pro",
      "name": "Pasalubong Pro",
      "icon": "🛍️",
      "desc": "Visit 2 shops"
    },
    {
      "id": "festival-goer",
      "name": "Festival Goer",
      "icon": "🎉",
      "desc": "Join 2 events"
    },
    {
      "id": "shutterbug",
      "name": "Shutterbug",
      "icon": "📸",
      "desc": "Take 3 SMILE photos"
    },
    {
      "id": "explorer",
      "name": "Iloilo Explorer",
      "icon": "🧭",
      "desc": "One check-in in every category"
    },
    {
      "id": "smile-master",
      "name": "SMILE Master",
      "icon": "🌞",
      "desc": "Earn 500 points"
    }
  ],
  badgeTests: {
    'first-step': s => s.total >= 1,
    'heritage-hunter': s => s.landmarks >= 3,
    'foodie': s => s.restaurants >= 3,
    'pasalubong-pro': s => s.shops >= 2,
    'festival-goer': s => s.events >= 2,
    'shutterbug': s => s.photos >= 3,
    'explorer': s => s.landmarks && s.restaurants && s.shops && s.events,
    'smile-master': s => s.points >= 500
  },
  places: [
    {
      "id": "lm-molo",
      "category": "landmarks",
      "name": "Molo Church (St. Anne Parish)",
      "area": "Molo",
      "tags": [
        "heritage",
        "church"
      ],
      "description": "Gothic-Renaissance coral-stone church known as the \"feminist church\" for its rows of female saints.",
      "points": 20
    },
    {
      "id": "lm-jaro",
      "category": "landmarks",
      "name": "Jaro Metropolitan Cathedral",
      "area": "Jaro",
      "tags": [
        "heritage",
        "church"
      ],
      "description": "Seat of the Archdiocese and home of Our Lady of the Candles, with its belfry standing across the plaza.",
      "points": 20
    },
    {
      "id": "lm-miagao",
      "category": "landmarks",
      "name": "Miag-ao Church",
      "area": "Miag-ao",
      "tags": [
        "UNESCO",
        "heritage"
      ],
      "description": "UNESCO World Heritage Baroque church with a famous sculpted façade, about an hour south of the city.",
      "points": 20
    },
    {
      "id": "lm-calle",
      "category": "landmarks",
      "name": "Calle Real Heritage District",
      "area": "City Proper",
      "tags": [
        "heritage",
        "walk"
      ],
      "description": "J.M. Basa Street lined with restored American-era buildings. Best explored on foot.",
      "points": 20
    },
    {
      "id": "lm-museo",
      "category": "landmarks",
      "name": "Museo Iloilo",
      "area": "City Proper",
      "tags": [
        "museum"
      ],
      "description": "Provincial museum of Panay's history, from pre-colonial gold to shipwreck finds.",
      "points": 20
    },
    {
      "id": "lm-esplanade",
      "category": "landmarks",
      "name": "Iloilo River Esplanade",
      "area": "Mandurriao",
      "tags": [
        "park",
        "sunset"
      ],
      "description": "A long riverside promenade lined with mangroves, made for jogging and sunset strolls.",
      "points": 20
    },
    {
      "id": "rs-batchoy",
      "category": "restaurants",
      "name": "La Paz Batchoy at La Paz Market",
      "area": "La Paz",
      "tags": [
        "batchoy",
        "local"
      ],
      "description": "Try the original noodle soup at the market where it was born.",
      "points": 15
    },
    {
      "id": "rs-breakthru",
      "category": "restaurants",
      "name": "Breakthrough Restaurant",
      "area": "Villa Arevalo",
      "tags": [
        "seafood"
      ],
      "description": "A seaside seafood favorite. Order the fresh catch grilled or as kinilaw.",
      "points": 15
    },
    {
      "id": "rs-tatoys",
      "category": "restaurants",
      "name": "Tatoy's Manokan & Seafoods",
      "area": "Villa Arevalo",
      "tags": [
        "chicken",
        "seafood"
      ],
      "description": "Native lechon manok and seafood by the beach.",
      "points": 15
    },
    {
      "id": "rs-madge",
      "category": "restaurants",
      "name": "Madge Café",
      "area": "La Paz",
      "tags": [
        "coffee",
        "heritage"
      ],
      "description": "Old-school coffee counter inside La Paz Market.",
      "points": 15
    },
    {
      "id": "rs-roberto",
      "category": "restaurants",
      "name": "Roberto's",
      "area": "City Proper",
      "tags": [
        "siopao"
      ],
      "description": "Home of the jumbo \"Queen\" siopao.",
      "points": 15
    },
    {
      "id": "sh-biscocho",
      "category": "shops",
      "name": "Biscocho Haus",
      "area": "Jaro",
      "tags": [
        "pasalubong"
      ],
      "description": "Butterscotch, biscocho and other Ilonggo pasalubong.",
      "points": 10
    },
    {
      "id": "sh-hablon",
      "category": "shops",
      "name": "Miag-ao Hablon Weavers",
      "area": "Miag-ao",
      "tags": [
        "handicraft",
        "textile"
      ],
      "description": "Hand-woven hablon fabric made on traditional looms.",
      "points": 10
    },
    {
      "id": "sh-molo",
      "category": "shops",
      "name": "Panaderia de Molo",
      "area": "Molo",
      "tags": [
        "bakery",
        "heritage"
      ],
      "description": "One of the oldest bakeries in the country. Try the galletas and broas.",
      "points": 10
    },
    {
      "id": "sh-market",
      "category": "shops",
      "name": "Iloilo Central Market",
      "area": "City Proper",
      "tags": [
        "market"
      ],
      "description": "Dried fish, local delicacies and everyday finds.",
      "points": 10
    },
    {
      "id": "sh-deocampo",
      "category": "shops",
      "name": "Deocampo Barquillos",
      "area": "Molo",
      "tags": [
        "pasalubong",
        "heritage"
      ],
      "description": "Family-run maker of thin, rolled barquillos wafers, a Molo favorite for generations.",
      "points": 10
    },
    {
      "id": "sh-mansion",
      "category": "shops",
      "name": "Molo Mansion Souvenir Shop",
      "area": "Molo",
      "tags": [
        "souvenir",
        "heritage"
      ],
      "description": "Iloilo-made crafts and delicacies sold inside the restored Yusay-Consing mansion.",
      "points": 10
    },
    {
      "id": "sh-lapaz",
      "category": "shops",
      "name": "La Paz Public Market",
      "area": "La Paz",
      "tags": [
        "market",
        "local"
      ],
      "description": "Fresh produce, dried goods and native snacks, steps from the batchoy stalls.",
      "points": 10
    },
    {
      "id": "sh-smcity",
      "category": "shops",
      "name": "SM City Iloilo",
      "area": "Mandurriao",
      "tags": [
        "mall"
      ],
      "description": "Large mall with a pasalubong section, groceries and dining.",
      "points": 10
    },
    {
      "id": "sh-festive",
      "category": "shops",
      "name": "Festive Walk Iloilo",
      "area": "Mandurriao",
      "tags": [
        "mall",
        "lifestyle"
      ],
      "description": "Open-air lifestyle mall in Iloilo Business Park with shops, cafés and events.",
      "points": 10
    },
    {
      "id": "sh-robinsons",
      "category": "shops",
      "name": "Robinsons Place Iloilo",
      "area": "City Proper",
      "tags": [
        "mall"
      ],
      "description": "Downtown mall near Calle Real, handy for shopping between heritage stops.",
      "points": 10
    },
    {
      "id": "sh-atria",
      "category": "shops",
      "name": "Atria Park District",
      "area": "Mandurriao",
      "tags": [
        "mall",
        "dining"
      ],
      "description": "Lifestyle center with boutiques, a supermarket and restaurants.",
      "points": 10
    },
    {
      "id": "ev-dinagyang",
      "category": "events",
      "name": "Dinagyang Festival",
      "area": "City Proper",
      "schedule": "Fourth weekend of January",
      "tags": [
        "festival",
        "Santo Niño"
      ],
      "description": "Iloilo's biggest festival: tribes in vivid costumes dance to thundering drums in honor of the Santo Niño.",
      "points": 25
    },
    {
      "id": "ev-kasadyahan",
      "category": "events",
      "name": "Kasadyahan Cultural Competition",
      "area": "City Proper",
      "schedule": "January, during Dinagyang week",
      "tags": [
        "festival",
        "culture"
      ],
      "description": "Towns across Iloilo bring their own festivals to the city's streets in one colorful parade.",
      "points": 25
    },
    {
      "id": "ev-candelaria",
      "category": "events",
      "name": "Jaro Fiesta (Our Lady of the Candles)",
      "area": "Jaro",
      "schedule": "February 2",
      "tags": [
        "fiesta",
        "heritage"
      ],
      "description": "Feast of the Candelaria at Jaro Cathedral, with a procession, a fair and the fiesta queen.",
      "points": 25
    },
    {
      "id": "ev-paraw",
      "category": "events",
      "name": "Paraw Regatta Festival",
      "area": "Villa Arevalo",
      "schedule": "February",
      "tags": [
        "sailing",
        "beach"
      ],
      "description": "Traditional paraw sailboats race across the Iloilo Strait, with beach activities along the shore.",
      "points": 25
    },
    {
      "id": "ev-pintados",
      "category": "events",
      "name": "Pintados de Passi Festival",
      "area": "Passi City",
      "schedule": "March",
      "tags": [
        "festival",
        "dance"
      ],
      "description": "Body-painted dancers recall the tattooed warriors of old Panay.",
      "points": 25
    },
    {
      "id": "ev-charter",
      "category": "events",
      "name": "Iloilo City Charter Day",
      "area": "City Proper",
      "schedule": "August 25",
      "tags": [
        "civic",
        "celebration"
      ],
      "description": "The city's birthday, celebrated with programs and community activities.",
      "points": 25
    }
  ]
};

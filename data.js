/* Shared data: categories, demo places, badges (mirrors backend/Code.gs) */
window.SMILE_DATA = {
  categories: [
    { id: 'landmarks',   name: 'Landmarks',             icon: '📍', color: 'var(--c-landmarks)',   img: 'assets/cat-landmarks.jpg',   blurb: 'Heritage churches, plazas & museums' },
    { id: 'restaurants', name: 'Restaurants & Cafés',   icon: '🍴', color: 'var(--c-restaurants)', img: 'assets/cat-restaurants.jpg', blurb: 'Batchoy, seafood & coffee' },
    { id: 'shops',       name: 'Shops',                 icon: '🛍️', color: 'var(--c-shops)',       img: 'assets/cat-shops.jpg',       blurb: 'Pasalubong, hablon & crafts' },
    { id: 'experiences', name: 'Experiences',           icon: '📷', color: 'var(--c-experiences)', img: 'assets/cat-experiences.jpg', blurb: 'Festivals, islands & tours' }
  ],
  points: { landmarks: 20, restaurants: 15, shops: 10, experiences: 25 },
  badges: [
    { id: 'first-step',      name: 'First Step',      icon: '👣', desc: 'Your first check-in' },
    { id: 'heritage-hunter', name: 'Heritage Hunter', icon: '⛪', desc: 'Visit 3 landmarks' },
    { id: 'foodie',          name: 'Ilonggo Foodie',  icon: '🍜', desc: 'Check in at 3 restaurants or cafés' },
    { id: 'pasalubong-pro',  name: 'Pasalubong Pro',  icon: '🛍️', desc: 'Visit 2 shops' },
    { id: 'adventurer',      name: 'Adventurer',      icon: '📸', desc: 'Complete 2 experiences' },
    { id: 'explorer',        name: 'Iloilo Explorer', icon: '🧭', desc: 'One check-in in every category' },
    { id: 'smile-master',    name: 'SMILE Master',    icon: '🌞', desc: 'Earn 300 points' }
  ],
  badgeTests: {
    'first-step':      s => s.total >= 1,
    'heritage-hunter': s => s.landmarks >= 3,
    'foodie':          s => s.restaurants >= 3,
    'pasalubong-pro':  s => s.shops >= 2,
    'adventurer':      s => s.experiences >= 2,
    'explorer':        s => s.landmarks && s.restaurants && s.shops && s.experiences,
    'smile-master':    s => s.points >= 300
  },
  places: [
    { id: 'lm-molo',      category: 'landmarks',   name: 'Molo Church (St. Anne Parish)', area: 'Molo',        tags: ['heritage','church'], description: 'Gothic-Renaissance coral-stone church known as the "feminist church" for its rows of female saints.' },
    { id: 'lm-jaro',      category: 'landmarks',   name: 'Jaro Metropolitan Cathedral',   area: 'Jaro',        tags: ['heritage','church'], description: 'Seat of the Archdiocese and home of Our Lady of the Candles, with its belfry standing across the plaza.' },
    { id: 'lm-miagao',    category: 'landmarks',   name: 'Miag-ao Church',                area: 'Miag-ao',     tags: ['UNESCO','heritage'], description: 'UNESCO World Heritage Baroque church with a famous sculpted façade, about an hour south of the city.' },
    { id: 'lm-calle',     category: 'landmarks',   name: 'Calle Real Heritage District',  area: 'City Proper', tags: ['heritage','walk'],   description: 'J.M. Basa Street lined with restored American-era buildings. Best explored on foot.' },
    { id: 'lm-museo',     category: 'landmarks',   name: 'Museo Iloilo',                  area: 'City Proper', tags: ['museum'],            description: "Provincial museum of Panay's history, from pre-colonial gold to shipwreck finds." },
    { id: 'lm-esplanade', category: 'landmarks',   name: 'Iloilo River Esplanade',        area: 'Mandurriao',  tags: ['park','sunset'],     description: 'A long riverside promenade lined with mangroves, made for jogging and sunset strolls.' },

    { id: 'rs-batchoy',   category: 'restaurants', name: 'La Paz Batchoy at La Paz Market', area: 'La Paz',    tags: ['batchoy','local'],   description: 'Try the original noodle soup at the market where it was born.' },
    { id: 'rs-breakthru', category: 'restaurants', name: 'Breakthrough Restaurant',       area: 'Villa Arevalo', tags: ['seafood'],         description: 'A seaside seafood favorite. Order the fresh catch grilled or as kinilaw.' },
    { id: 'rs-tatoys',    category: 'restaurants', name: "Tatoy's Manokan & Seafoods",    area: 'Villa Arevalo', tags: ['chicken','seafood'], description: 'Native lechon manok and seafood by the beach.' },
    { id: 'rs-madge',     category: 'restaurants', name: 'Madge Café',                    area: 'La Paz',      tags: ['coffee','heritage'], description: 'Old-school coffee counter inside La Paz Market.' },
    { id: 'rs-roberto',   category: 'restaurants', name: "Roberto's",                     area: 'City Proper', tags: ['siopao'],            description: 'Home of the jumbo "Queen" siopao.' },

    { id: 'sh-biscocho',  category: 'shops',       name: 'Biscocho Haus',                 area: 'Jaro',        tags: ['pasalubong'],        description: 'Butterscotch, biscocho and other Ilonggo pasalubong.' },
    { id: 'sh-hablon',    category: 'shops',       name: 'Miag-ao Hablon Weavers',        area: 'Miag-ao',     tags: ['handicraft','textile'], description: 'Hand-woven hablon fabric made on traditional looms.' },
    { id: 'sh-molo',      category: 'shops',       name: 'Panaderia de Molo',             area: 'Molo',        tags: ['bakery','heritage'], description: 'One of the oldest bakeries in the country. Try the galletas and broas.' },
    { id: 'sh-market',    category: 'shops',       name: 'Iloilo Central Market',         area: 'City Proper', tags: ['market'],            description: 'Dried fish, local delicacies and everyday finds.' },
    { id: 'sh-deocampo',  category: 'shops',       name: 'Deocampo Barquillos',           area: 'Molo',      tags: ['pasalubong','heritage'], description: 'Family-run maker of thin, rolled barquillos wafers, a Molo favorite for generations.' },
    { id: 'sh-mansion',   category: 'shops',       name: 'Molo Mansion Souvenir Shop',    area: 'Molo',      tags: ['souvenir','heritage'], description: 'Iloilo-made crafts and delicacies sold inside the restored Yusay-Consing mansion.' },
    { id: 'sh-lapaz',     category: 'shops',       name: 'La Paz Public Market',          area: 'La Paz',    tags: ['market','local'],   description: 'Fresh produce, dried goods and native snacks, steps from the batchoy stalls.' },
    { id: 'sh-smcity',    category: 'shops',       name: 'SM City Iloilo',                area: 'Mandurriao', tags: ['mall'],          description: 'Large mall with a pasalubong section, groceries and dining.' },
    { id: 'sh-festive',   category: 'shops',       name: 'Festive Walk Iloilo',           area: 'Mandurriao', tags: ['mall','lifestyle'], description: 'Open-air lifestyle mall in Iloilo Business Park with shops, cafés and events.' },
    { id: 'sh-robinsons', category: 'shops',       name: 'Robinsons Place Iloilo',        area: 'City Proper', tags: ['mall'],         description: 'Downtown mall near Calle Real, handy for shopping between heritage stops.' },
    { id: 'sh-atria',     category: 'shops',       name: 'Atria Park District',           area: 'Mandurriao', tags: ['mall','dining'],   description: 'Lifestyle center with boutiques, a supermarket and restaurants.' },

    { id: 'ex-dinagyang', category: 'experiences', name: 'Dinagyang Festival',            area: 'City Proper', tags: ['festival','January'], description: 'Every January the streets fill with tribe performances honoring the Santo Niño.' },
    { id: 'ex-guimaras',  category: 'experiences', name: 'Guimaras Island Day Trip',      area: 'Ortiz Wharf', tags: ['boat','mango'],      description: 'A short pumpboat ride to mango farms and white-sand coves.' },
    { id: 'ex-gigantes',  category: 'experiences', name: 'Islas de Gigantes Hopping',     area: 'Carles',      tags: ['island','beach'],    description: 'Lagoons, sandbars and scallops in northern Iloilo.' },
    { id: 'ex-foodtrip',  category: 'experiences', name: '#IloiloFoodTrip Heritage Walk', area: 'City Proper', tags: ['food','walk'],       description: 'Walk Calle Real and stop for batchoy, pancit Molo and coffee along the way.' }
  ]
};

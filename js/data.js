/* =====================================================
   Doctor Jachnun - Menu Data
   Easy to update - just change items here!
   ===================================================== */

const MENU_ITEMS = [
    // Main Dishes - Jachnun
    {
        id: 1,
        name: "סיר ג'חנון המלך",
        description: "סיר הג'חנון המדובר - קריספי מבחוץ ורך מבפנים. מגיע עם רסק עגבניות וסחוג. ניתן להוסיף ביצים וסמנה בתוספת תשלום",
        price: 150,
        category: "main",
        image: "images/products/jachnun-pot.jpeg",
        popular: true,
        badge: "המלך"
    },
    {
        id: 2,
        name: "מארז 10 ג'חנונים",
        description: "מארז של 10 יחידות ג'חנון שמנות ויפות לאפייה ביתית. אחרי לילה שלם של אפיה יקבלו גוון שחום ונימוך בפיך",
        price: 150,
        category: "main",
        image: "images/products/jachnun-package.jpeg",
        popular: true,
        badge: "מארז"
    },
    {
        id: 3,
        name: "קובנה המלכה",
        description: "הכירו את הקובנה מלכה - גדולה ועסיסית, הכי יפה בתימן",
        price: 70,
        category: "main",
        image: "images/products/kubaneh.png",
        popular: true,
        badge: "המלכה"
    },

    // Lachuch
    {
        id: 4,
        name: "לחוח - יחידה",
        description: "הלחוח שלנו הכי טרי אווירירי וטעים",
        price: 6,
        category: "lachuch",
        image: "images/products/lachuch.jpeg",
        popular: false
    },
    {
        id: 5,
        name: "לחוח - 2 יחידות",
        description: "הלחוח שלנו הכי טרי אווירירי וטעים",
        price: 10,
        category: "lachuch",
        image: "images/products/lachuch.jpeg",
        popular: false
    },
    {
        id: 6,
        name: "לחוח - 3 יחידות",
        description: "הלחוח שלנו הכי טרי אווירירי וטעים",
        price: 15,
        category: "lachuch",
        image: "images/products/lachuch.jpeg",
        popular: false
    },
    {
        id: 7,
        name: "לחוח - 4 יחידות",
        description: "הלחוח שלנו הכי טרי אווירירי וטעים",
        price: 20,
        category: "lachuch",
        image: "images/products/lachuch.jpeg",
        popular: true,
        badge: "משתלם"
    },

    // Malawach
    {
        id: 8,
        name: "מלאווח קריספי",
        description: "המלאווח הכי קריספי בעולם - קנה 10 קבל 2 במתנה!",
        price: 10,
        category: "malawach",
        image: "images/products/malawach.jpeg",
        popular: true,
        badge: "10+2"
    },

    // Sauces & Extras
    {
        id: 9,
        name: "סחוג צנצנת",
        description: "סחוג ביתי חריף ומיוחד בצנצנת עם פקק שעם",
        price: 25,
        category: "extras",
        image: "images/products/schug.jpeg",
        popular: true
    },
    {
        id: 10,
        name: "סמנה צנצנת",
        description: "סמנה (חמאה מזוקקת) איכותית לג'חנון מושלם",
        price: 40,
        category: "extras",
        image: "images/products/samneh.jpeg",
        popular: true
    },
    {
        id: 11,
        name: "רסק עגבניות חצי ק\"ג",
        description: "רסק עגבניות ביתי טרי - חצי קילו",
        price: 10,
        category: "extras",
        image: "images/products/tomato-paste.jpeg",
        popular: false
    },

    // Special Deals
    {
        id: 12,
        name: "מבצע חורף - סיר ג'חנון + קובנה",
        description: "מבצע מיוחד! סיר ג'חנון + סיר קובנה במחיר מיוחד. היה 230 ש\"ח!",
        price: 199,
        category: "deals",
        image: "images/products/jachnun-pot.jpeg",
        popular: true,
        badge: "מבצע!"
    }
];

// Categories for menu display
const CATEGORIES = [
    { id: 'all', name: 'הכל', icon: '🍽️' },
    { id: 'main', name: 'מנות עיקריות', icon: '👑' },
    { id: 'lachuch', name: 'לחוח', icon: '🫓' },
    { id: 'malawach', name: 'מלאווח', icon: '🥙' },
    { id: 'extras', name: 'תוספות ורטבים', icon: '🫙' },
    { id: 'deals', name: 'מבצעים', icon: '🔥' }
];

// Delivery zones configuration
const DELIVERY_ZONES = {
    pickup: { name: "איסוף עצמי", price: 0 },
    zone1: { name: "אזור מרכז", price: 20 },
    zone2: { name: "ערים סמוכות", price: 35 },
    zone3: { name: "אזורים רחוקים", price: 50 }
};

// Business info
const BUSINESS_INFO = {
    name: "דוקטור ג'חנון",
    slogan: "חוויה תימנית אותנטית, בכל בית",
    phone: "0522212410",
    whatsapp: "972522212410",
    instagram: "doctorjachnun",
    email: "doctorjachnun@gmail.com"
};

// Helper function to get item by ID
function getItemById(id) {
    return MENU_ITEMS.find(item => item.id === id);
}

// Helper function to get items by category
function getItemsByCategory(category) {
    if (category === 'all') return MENU_ITEMS;
    return MENU_ITEMS.filter(item => item.category === category);
}

// Helper function to get popular items
function getPopularItems() {
    return MENU_ITEMS.filter(item => item.popular);
}

// Helper function to get category info
function getCategoryInfo(categoryId) {
    return CATEGORIES.find(cat => cat.id === categoryId);
}

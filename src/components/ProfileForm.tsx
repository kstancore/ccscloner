import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  nickname: z.string().trim().min(1, { message: "Nickname is required" }).max(40),
  username: z.string().trim().min(3, { message: "Username must be at least 3 characters" }).max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, { message: "Username can only use letters, numbers, . _ -" }),
  occupation: z.enum(["Professional", "Student"], { message: "Choose professional or student" }),
  organization: z.string().trim().min(1, { message: "Workspace or institution is required" }).max(120),
  city: z.string().trim().min(1, { message: "City is required" }).max(80),
  country: z.string().trim().min(1, { message: "Country is required" }).max(80),
});

const countries = [
  "Australia",
  "Canada",
  "France",
  "Germany",
  "India",
  "Italy",
  "Japan",
  "Netherlands",
  "Singapore",
  "Spain",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
];

const citiesByCountry: Record<string, string[]> = {
  Australia: [
    "Adelaide", "Albury", "Alice Springs", "Armidale", "Ballarat", "Bathurst",
    "Bendigo", "Brisbane", "Broome", "Bundaberg", "Burnie", "Cairns",
    "Canberra", "Coffs Harbour", "Dandenong", "Darwin", "Devonport", "Dubbo",
    "Geelong", "Geraldton", "Gladstone", "Gold Coast", "Gosford", "Goulburn",
    "Hobart", "Ipswich", "Kalgoorlie", "Katoomba", "Launceston", "Lismore",
    "Mackay", "Maitland", "Mandurah", "Melbourne", "Mildura", "Mount Gambier",
    "Newcastle", "Nowra", "Orange", "Perth", "Port Macquarie", "Rockhampton",
    "Shepparton", "Sunshine Coast", "Sydney", "Tamworth", "Toowoomba",
    "Townsville", "Wagga Wagga", "Warrnambool", "Whyalla", "Wollongong"
  ],
  Canada: [
    "Barrie", "Belleville", "Brampton", "Brandon", "Brantford", "Burlington",
    "Burnaby", "Calgary", "Cambridge", "Cape Breton", "Chatham-Kent", "Chilliwack",
    "Coquitlam", "Drummondville", "Edmonton", "Fredericton", "Gatineau",
    "Greater Sudbury", "Guelph", "Halifax", "Hamilton", "Kamloops", "Kelowna",
    "Kingston", "Kitchener", "Langley", "Laval", "Leamington", "London",
    "Longueuil", "Markham", "Medicine Hat", "Mississauga", "Moncton", "Montreal",
    "Moose Jaw", "Nanaimo", "New Westminster", "Oakville", "Oshawa", "Ottawa",
    "Peterborough", "Prince George", "Quebec City", "Red Deer", "Regina",
    "Repentigny", "Richmond", "Richmond Hill", "Saguenay", "Saskatoon",
    "Sault Ste. Marie", "Sherbrooke", "St. Catharines", "St. John's", "Surrey",
    "Terrebonne", "Thunder Bay", "Toronto", "Trois-Rivières", "Vancouver",
    "Vaughan", "Victoria", "Waterloo", "Whitby", "Windsor", "Winnipeg"
  ],
  France: [
    "Aix-en-Provence", "Ajaccio", "Amiens", "Angers", "Angoulême", "Annecy",
    "Antibes", "Arles", "Avignon", "Bayonne", "Besançon", "Béziers", "Blois",
    "Bordeaux", "Boulogne-Billancourt", "Brest", "Caen", "Calais", "Cannes",
    "Chambéry", "Charleville-Mézières", "Châteauroux", "Cherbourg", "Clermont-Ferrand",
    "Colmar", "Compiègne", "Dijon", "Dunkirk", "Évry", "Grenoble", "La Rochelle",
    "Le Havre", "Le Mans", "Lille", "Limoges", "Lorient", "Lyon", "Mâcon",
    "Marseille", "Metz", "Montpellier", "Mulhouse", "Nancy", "Nanterre",
    "Nantes", "Nice", "Nîmes", "Orléans", "Paris", "Pau", "Perpignan", "Poitiers",
    "Reims", "Rennes", "Roubaix", "Rouen", "Saint-Denis", "Saint-Étienne",
    "Saint-Nazaire", "Strasbourg", "Toulon", "Toulouse", "Tours", "Troyes",
    "Valence", "Villeurbanne"
  ],
  Germany: [
    "Aachen", "Augsburg", "Bamberg", "Bayreuth", "Berlin", "Bielefeld",
    "Bochum", "Bonn", "Bottrop", "Brandenburg", "Braunschweig", "Bremen",
    "Bremerhaven", "Chemnitz", "Cologne", "Cottbus", "Darmstadt", "Dortmund",
    "Dresden", "Duisburg", "Düsseldorf", "Erfurt", "Erlangen", "Essen",
    "Frankfurt", "Freiburg", "Fürth", "Gelsenkirchen", "Gera", "Göttingen",
    "Hagen", "Halle", "Hamburg", "Hamm", "Hanover", "Heidelberg", "Herne",
    "Hildesheim", "Ingolstadt", "Jena", "Karlsruhe", "Kassel", "Kiel",
    "Koblenz", "Krefeld", "Leipzig", "Leverkusen", "Lübeck", "Ludwigshafen",
    "Magdeburg", "Mainz", "Mannheim", "Marl", "Moers", "Mönchengladbach",
    "Munich", "Münster", "Neuss", "Nuremberg", "Oberhausen", "Offenbach",
    "Oldenburg", "Osnabrück", "Paderborn", "Pforzheim", "Potsdam", "Recklinghausen",
    "Regensburg", "Remscheid", "Reutlingen", "Rostock", "Saarbrücken", "Salzgitter",
    "Siegen", "Solingen", "Stuttgart", "Trier", "Ulm", "Wiesbaden", "Wolfsburg",
    "Wuppertal", "Würzburg"
  ],
  India: [
    "Agra", "Ahmedabad", "Ahmednagar", "Ajmer", "Akola", "Aligarh", "Allahabad",
    "Ambala", "Amritsar", "Anand", "Asansol", "Aurangabad", "Bangalore",
    "Bareilly", "Belgaum", "Bhavnagar", "Bhilai", "Bhopal", "Bhubaneswar",
    "Bikaner", "Bilaspur", "Bokaro", "Chandigarh", "Chennai", "Coimbatore",
    "Cuttack", "Dehradun", "Delhi", "Dhanbad", "Durgapur", "Erode", "Faridabad",
    "Firozabad", "Ghaziabad", "Goa", "Gorakhpur", "Gulbarga", "Guntur", "Gurgaon",
    "Guwahati", "Gwalior", "Haridwar", "Hisar", "Hubli", "Hyderabad", "Imphal",
    "Indore", "Jabalpur", "Jaipur", "Jalandhar", "Jammu", "Jamnagar", "Jamshedpur",
    "Jhansi", "Jodhpur", "Kanpur", "Kanyakumari", "Kochi", "Kolhapur", "Kolkata",
    "Kota", "Kottayam", "Kozhikode", "Lucknow", "Ludhiana", "Madurai", "Mangalore",
    "Mathura", "Meerut", "Moradabad", "Mumbai", "Mysore", "Nagpur", "Nashik",
    "Navi Mumbai", "Nellore", "Noida", "Patna", "Pondicherry", "Pune", "Raipur",
    "Rajkot", "Ranchi", "Rourkela", "Salem", "Shillong", "Shimla", "Siliguri",
    "Solapur", "Srinagar", "Surat", "Thane", "Thrissur", "Tiruchirappalli",
    "Tirupati", "Trivandrum", "Udaipur", "Vadodara", "Varanasi", "Vasai",
    "Vijayawada", "Visakhapatnam", "Warangal"
  ],
  Italy: [
    "Alessandria", "Ancona", "Andria", "Arezzo", "Asti", "Bari", "Barletta",
    "Bergamo", "Bologna", "Bolzano", "Brescia", "Brindisi", "Cagliari",
    "Caltanissetta", "Caserta", "Catania", "Catanzaro", "Como", "Cremona",
    "Ferrara", "Florence", "Foggia", "Forlì", "Genoa", "Giugliano", "La Spezia",
    "Lecce", "Lecco", "Livorno", "Lucca", "Marsala", "Messina", "Milan",
    "Modena", "Monza", "Naples", "Novara", "Padua", "Palermo", "Parma",
    "Pavia", "Perugia", "Pescara", "Piacenza", "Pisa", "Pistoia", "Ragusa",
    "Ravenna", "Reggio Calabria", "Reggio Emilia", "Rimini", "Rome", "Salerno",
    "Sassari", "Siracusa", "Sondrio", "Taranto", "Terni", "Trento", "Trieste",
    "Turin", "Udine", "Varese", "Venice", "Verona", "Vicenza"
  ],
  Japan: [
    "Akita", "Amagasaki", "Aomori", "Asahikawa", "Chiba", "Fuji", "Fujisawa",
    "Fukui", "Fukuoka", "Fukushima", "Funabashi", "Gifu", "Hachioji", "Hakodate",
    "Hamamatsu", "Higashiosaka", "Himeji", "Hiroshima", "Ichikawa", "Ichinomiya",
    "Iwaki", "Kagoshima", "Kakogawa", "Kanazawa", "Kashiwa", "Kasugai", "Kawagoe",
    "Kawaguchi", "Kawasaki", "Kitakyushu", "Kobe", "Kochi", "Koriyama", "Koshigaya",
    "Kumamoto", "Kurashiki", "Kure", "Kyoto", "Maebashi", "Matsudo", "Matsumoto",
    "Matsuyama", "Miyazaki", "Morioka", "Nagano", "Nagasaki", "Nagoya", "Nara",
    "Neyagawa", "Niigata", "Nishinomiya", "Oita", "Okayama", "Okinawa", "Osaka",
    "Otsu", "Sagamihara", "Saitama", "Sakai", "Sapporo", "Sendai", "Shimonoseki",
    "Shizuoka", "Suita", "Takamatsu", "Takasaki", "Tokorozawa", "Tokushima",
    "Tokyo", "Toyama", "Toyohashi", "Toyonaka", "Toyota", "Utsunomiya", "Wakayama",
    "Yao", "Yokkaichi", "Yokohama", "Yokosuka"
  ],
  Netherlands: [
    "Alkmaar", "Almere", "Amersfoort", "Amstelveen", "Amsterdam", "Apeldoorn",
    "Arnhem", "Assen", "Breda", "Delft", "Den Bosch", "Deventer", "Dordrecht",
    "Ede", "Eindhoven", "Emmen", "Enschede", "Gouda", "Groningen", "Haarlem",
    "Haarlemmermeer", "Heerlen", "Helmond", "Hengelo", "Hilversum", "Hoofddorp",
    "Leeuwarden", "Leiden", "Lelystad", "Maastricht", "Nijmegen", "Oss",
    "Roosendaal", "Rotterdam", "Schiedam", "Sittard-Geleen", "Spijkenisse",
    "The Hague", "Tilburg", "Utrecht", "Veenendaal", "Venlo", "Westland",
    "Zaandam", "Zaanstad", "Zoetermeer", "Zwolle"
  ],
  Singapore: ["Singapore"],
  Spain: [
    "A Coruña", "Albacete", "Alcala de Henares", "Alcobendas", "Alicante",
    "Almería", "Avilés", "Badajoz", "Badalona", "Barcelona", "Bilbao", "Burgos",
    "Cádiz", "Cartagena", "Castellón", "Chiclana", "Cordoba", "Coslada",
    "Cuenca", "Elche", "Ferrol", "Fuenlabrada", "Gandia", "Getafe", "Gijón",
    "Girona", "Granada", "Guadalajara", "Huelva", "Ibiza", "Jaén", "Jerez",
    "La Laguna", "Las Palmas", "Leganés", "León", "Lleida", "Logroño", "Lugo",
    "Madrid", "Málaga", "Marbella", "Mataró", "Murcia", "Ourense", "Oviedo",
    "Palencia", "Palma", "Pamplona", "Pontevedra", "Reus", "Sabadell", "Salamanca",
    "San Cristóbal", "San Sebastián", "Santander", "Santa Cruz", "Santiago",
    "Seville", "Tarragona", "Terrassa", "Toledo", "Torrevieja", "Valencia",
    "Valladolid", "Vigo", "Vitoria-Gasteiz", "Zaragoza"
  ],
  "United Arab Emirates": [
    "Abu Dhabi", "Ajman", "Al Ain", "Dubai", "Fujairah", "Kalba", "Khor Fakkan",
    "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"
  ],
  "United Kingdom": [
    "Aberdeen", "Basildon", "Belfast", "Birmingham", "Blackburn", "Blackpool",
    "Bolton", "Bournemouth", "Bradford", "Brighton", "Bristol", "Burnley",
    "Cambridge", "Cardiff", "Carlisle", "Chelmsford", "Chester", "Coventry",
    "Crawley", "Derby", "Doncaster", "Dudley", "Dundee", "Eastbourne",
    "Edinburgh", "Exeter", "Gateshead", "Glasgow", "Gloucester", "Huddersfield",
    "Hull", "Ipswich", "Lancaster", "Leeds", "Leicester", "Liverpool", "London",
    "Luton", "Maidstone", "Manchester", "Middlesbrough", "Milton Keynes",
    "Newcastle", "Newport", "Northampton", "Norwich", "Nottingham", "Oldham",
    "Oxford", "Peterborough", "Plymouth", "Poole", "Portsmouth", "Preston",
    "Reading", "Rochdale", "Salford", "Sheffield", "Slough", "Solihull",
    "Southampton", "Southend", "Southport", "St Albans", "Stoke-on-Trent",
    "Sunderland", "Swansea", "Swindon", "Telford", "Wakefield", "Warrington",
    "West Bromwich", "Wigan", "Wolverhampton", "Worcester", "York"
  ],
  "United States": [
    "Akron", "Albuquerque", "Anaheim", "Anchorage", "Arlington", "Atlanta",
    "Aurora", "Austin", "Bakersfield", "Baltimore", "Baton Rouge", "Birmingham",
    "Boise", "Boston", "Buffalo", "Chandler", "Charlotte", "Chattanooga",
    "Chesapeake", "Chicago", "Chula Vista", "Cincinnati", "Cleveland", "Colorado Springs",
    "Columbus", "Corpus Christi", "Dallas", "Denver", "Des Moines", "Detroit",
    "Durham", "El Paso", "Fort Wayne", "Fort Worth", "Fremont", "Fresno",
    "Garland", "Gilbert", "Glendale", "Greensboro", "Henderson", "Honolulu",
    "Houston", "Indianapolis", "Irvine", "Irving", "Jackson", "Jacksonville",
    "Jersey City", "Kansas City", "Knoxville", "Laredo", "Las Vegas", "Lexington",
    "Lincoln", "Long Beach", "Los Angeles", "Louisville", "Lubbock", "Madison",
    "Memphis", "Mesa", "Miami", "Milwaukee", "Minneapolis", "Nashville", "New Orleans",
    "New York", "Newark", "Norfolk", "Oakland", "Oklahoma City", "Omaha",
    "Orlando", "Philadelphia", "Phoenix", "Pittsburgh", "Plano", "Portland",
    "Raleigh", "Reno", "Richmond", "Riverside", "Rochester", "Sacramento",
    "Salt Lake City", "San Antonio", "San Diego", "San Francisco", "San Jose",
    "Santa Ana", "Scottsdale", "Seattle", "St. Louis", "St. Paul", "St. Petersburg",
    "Stockton", "Tampa", "Toledo", "Tucson", "Tulsa", "Virginia Beach",
    "Washington D.C.", "Wichita", "Winston-Salem"
  ],
};


export function ProfileForm({
  profile,
  avatar,
  submitLabel,
  onSaved,
}: {
  profile: Profile | null;
  avatar: string | null;
  submitLabel: string;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    nickname: "",
    username: "",
    occupation: "",
    organization: "",
    city: "",
    country: "",
  });
  const [preview, setPreview] = useState<string | null>(avatar);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      nickname: profile.nickname ?? "",
      username: profile.username ?? "",
      occupation: profile.occupation ?? "",
      organization: profile.organization ?? "",
      city: profile.city ?? "",
      country: profile.country ?? "",
    });
  }, [profile]);

  useEffect(() => setPreview(avatar), [avatar]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (f.size > 5 * 1024 * 1024) return toast.error("Image must be smaller than 5 MB");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("You are not signed in");

      let avatarPath = profile?.avatar_url ?? null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw upErr;
        avatarPath = path;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        ...parsed.data,
        avatar_url: avatarPath,
        onboarded: true,
      });
      if (error) throw error;

      toast.success("Profile saved");
      setFile(null);
      await onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save profile";
      toast.error(msg.includes("duplicate") ? "That username is already taken" : msg);
    } finally {
      setBusy(false);
    }
  };

  const initials = (form.nickname || profile?.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-20 border border-border">
          {preview ? <AvatarImage src={preview} alt="Your profile picture" /> : null}
          <AvatarFallback className="bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            <Upload /> Upload profile picture
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">PNG or JPG, up to 5 MB.</p>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={pick} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nickname" hint="We'll call you this everywhere.">
          <Input
            value={form.nickname}
            maxLength={40}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            placeholder="Enter your nickname"
          />
        </Field>
        <Field label="Username">
          <Input
            value={form.username}
            maxLength={30}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Enter your username"
          />
        </Field>
        <Field label="Email" hint="From your sign-in — not editable.">
          <Input value={profile?.email ?? ""} readOnly disabled />
        </Field>
        <Field label="I am a…">
          <Select
            value={form.occupation}
            onValueChange={(v) => setForm({ ...form, occupation: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Professional or student" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Professional">Professional</SelectItem>
              <SelectItem value="Student">Student</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Workspace or institution">
          <Input
            value={form.organization}
            maxLength={120}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
            placeholder="Enter workspace or institution"
          />
        </Field>
        <Field label="Country">
          <Select
            value={form.country}
            onValueChange={(v) => setForm({ ...form, country: v, city: "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="City">
          <Select
            value={form.city}
            onValueChange={(v) => setForm({ ...form, city: v })}
            disabled={!form.country}
          >
            <SelectTrigger>
              <SelectValue placeholder={form.country ? "Select your city" : "Choose a country first"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {(citiesByCountry[form.country] ?? []).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Button disabled={busy} onClick={save}>
        {busy ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

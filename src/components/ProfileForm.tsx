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
    "Adelaide", "Albury", "Alice Springs", "Ballarat", "Bendigo", "Brisbane",
    "Bundaberg", "Cairns", "Canberra", "Coffs Harbour", "Darwin", "Dubbo",
    "Geelong", "Gold Coast", "Gosford", "Hobart", "Launceston", "Mackay",
    "Melbourne", "Newcastle", "Perth", "Port Macquarie", "Rockhampton",
    "Sunshine Coast", "Sydney", "Toowoomba", "Townsville", "Wollongong"
  ],
  Canada: [
    "Barrie", "Brampton", "Calgary", "Edmonton", "Gatineau", "Halifax",
    "Hamilton", "Kitchener", "London", "Longueuil", "Markham", "Mississauga",
    "Montreal", "Ottawa", "Quebec City", "Regina", "Richmond", "Richmond Hill",
    "Saskatoon", "Sherbrooke", "St. Catharines", "Surrey", "Toronto",
    "Vancouver", "Vaughan", "Victoria", "Windsor", "Winnipeg"
  ],
  France: [
    "Aix-en-Provence", "Amiens", "Angers", "Annecy", "Bordeaux", "Brest",
    "Caen", "Clermont-Ferrand", "Dijon", "Grenoble", "Le Havre", "Le Mans",
    "Lille", "Limoges", "Lyon", "Marseille", "Metz", "Montpellier", "Mulhouse",
    "Nancy", "Nantes", "Nice", "Nîmes", "Orléans", "Paris", "Perpignan",
    "Reims", "Rennes", "Rouen", "Saint-Étienne", "Strasbourg", "Toulon",
    "Toulouse", "Tours", "Villeurbanne"
  ],
  Germany: [
    "Aachen", "Augsburg", "Berlin", "Bielefeld", "Bochum", "Bonn", "Braunschweig",
    "Bremen", "Cologne", "Darmstadt", "Dortmund", "Dresden", "Duisburg",
    "Düsseldorf", "Essen", "Frankfurt", "Freiburg", "Gelsenkirchen", "Hagen",
    "Hamburg", "Hamm", "Hanover", "Heidelberg", "Karlsruhe", "Kassel",
    "Kiel", "Krefeld", "Leipzig", "Lübeck", "Magdeburg", "Mainz", "Mannheim",
    "Mönchengladbach", "Munich", "Münster", "Nuremberg", "Oberhausen",
    "Rostock", "Saarbrücken", "Stuttgart", "Wiesbaden", "Wuppertal"
  ],
  India: [
    "Agra", "Ahmedabad", "Allahabad", "Amritsar", "Aurangabad", "Bangalore",
    "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai", "Coimbatore", "Dehradun",
    "Delhi", "Dhanbad", "Faridabad", "Ghaziabad", "Goa", "Gurgaon", "Guwahati",
    "Hyderabad", "Indore", "Jaipur", "Jabalpur", "Jodhpur", "Kanpur", "Kochi",
    "Kolkata", "Kota", "Lucknow", "Ludhiana", "Madurai", "Meerut", "Mumbai",
    "Mysore", "Nagpur", "Nashik", "Noida", "Patna", "Pune", "Raipur",
    "Rajkot", "Ranchi", "Srinagar", "Surat", "Thane", "Udaipur", "Vadodara",
    "Varanasi", "Visakhapatnam"
  ],
  Italy: [
    "Ancona", "Bari", "Bergamo", "Bologna", "Brescia", "Cagliari", "Catania",
    "Florence", "Genoa", "La Spezia", "Lecce", "Livorno", "Messina", "Milan",
    "Modena", "Monza", "Naples", "Novara", "Padua", "Palermo", "Parma",
    "Perugia", "Pescara", "Pisa", "Ravenna", "Reggio Calabria", "Rimini",
    "Rome", "Salerno", "Sassari", "Syracuse", "Taranto", "Trento", "Trieste",
    "Turin", "Venice", "Verona", "Vicenza"
  ],
  Japan: [
    "Chiba", "Fukuoka", "Funabashi", "Hachioji", "Hamamatsu", "Higashiosaka",
    "Himeji", "Hiroshima", "Kagoshima", "Kanazawa", "Kawasaki", "Kitakyushu",
    "Kobe", "Kumamoto", "Kyoto", "Matsudo", "Matsuyama", "Nagoya", "Niigata",
    "Oita", "Okayama", "Osaka", "Sagamihara", "Saitama", "Sakai", "Sapporo",
    "Sendai", "Shizuoka", "Takamatsu", "Tokorozawa", "Tokyo", "Yokohama"
  ],
  Netherlands: [
    "Almere", "Amersfoort", "Amsterdam", "Apeldoorn", "Arnhem", "Breda",
    "Delft", "Den Bosch", "Eindhoven", "Emmen", "Enschede", "Groningen",
    "Haarlem", "Leeuwarden", "Leiden", "Maastricht", "Nijmegen", "Rotterdam",
    "The Hague", "Tilburg", "Utrecht", "Venlo", "Zaandam", "Zoetermeer"
  ],
  Singapore: ["Singapore"],
  Spain: [
    "A Coruña", "Albacete", "Alicante", "Almería", "Badajoz", "Barcelona",
    "Bilbao", "Burgos", "Cádiz", "Cartagena", "Castellón", "Córdoba",
    "Elche", "Gijón", "Granada", "Huelva", "Ibiza", "Jaén", "Las Palmas",
    "León", "Lleida", "Logroño", "Madrid", "Málaga", "Marbella", "Murcia",
    "Oviedo", "Palencia", "Palma", "Pamplona", "Salamanca", "San Sebastián",
    "Santander", "Seville", "Tarragona", "Terrassa", "Toledo", "Valencia",
    "Valladolid", "Vigo", "Vitoria-Gasteiz", "Zaragoza"
  ],
  "United Arab Emirates": [
    "Abu Dhabi", "Ajman", "Al Ain", "Dubai", "Fujairah", "Khor Fakkan",
    "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"
  ],
  "United Kingdom": [
    "Aberdeen", "Belfast", "Birmingham", "Blackpool", "Bournemouth", "Bradford",
    "Brighton", "Bristol", "Cambridge", "Cardiff", "Coventry", "Derby",
    "Edinburgh", "Exeter", "Glasgow", "Gloucester", "Hull", "Ipswich",
    "Leeds", "Leicester", "Liverpool", "London", "Luton", "Manchester",
    "Middlesbrough", "Milton Keynes", "Newcastle", "Newport", "Northampton",
    "Norwich", "Nottingham", "Oxford", "Peterborough", "Plymouth", "Portsmouth",
    "Preston", "Reading", "Sheffield", "Southampton", "Stoke-on-Trent",
    "Sunderland", "Swansea", "Swindon", "Wolverhampton", "York"
  ],
  "United States": [
    "Albuquerque", "Atlanta", "Austin", "Baltimore", "Boston", "Charlotte",
    "Chicago", "Cleveland", "Colorado Springs", "Columbus", "Dallas", "Denver",
    "Detroit", "El Paso", "Fort Worth", "Fresno", "Honolulu", "Houston",
    "Indianapolis", "Jacksonville", "Kansas City", "Las Vegas", "Long Beach",
    "Los Angeles", "Louisville", "Memphis", "Mesa", "Miami", "Milwaukee",
    "Minneapolis", "Nashville", "New Orleans", "New York", "Oakland",
    "Oklahoma City", "Omaha", "Orlando", "Philadelphia", "Phoenix", "Pittsburgh",
    "Portland", "Raleigh", "Sacramento", "Salt Lake City", "San Antonio",
    "San Diego", "San Francisco", "San Jose", "Seattle", "St. Louis", "Tampa",
    "Tucson", "Tulsa", "Virginia Beach", "Washington D.C."
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

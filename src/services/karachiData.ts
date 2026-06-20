export interface UCData {
  ucNo: string;
  name: string;
  chairman: string;
  contact?: string;
  email: string;
}

export interface TownData {
  name: string;
  townChairman: string;
  ucs: UCData[];
}

export const KARACHI_TOWNS: TownData[] = [
  {
    name: "New Karachi",
    townChairman: "Muhammad Yousuf",
    ucs: [
      { ucNo: "UC-01", name: "Shahnawaz Bhutto Colony", chairman: "Muhammad Naveed", contact: "+92 345 2154417", email: "chairman.nk01@fixkarachi.gos.pk" },
      { ucNo: "UC-02", name: "Gulshan-e-Saeed", chairman: "Muhammad Ahmer Khan", contact: "+92 300 1234567", email: "chairman.nk02@fixkarachi.gos.pk" },
      { ucNo: "UC-03", name: "Khawaja Ajmeer Nagri", chairman: "Muhammad Ali Arshad", contact: "+92 300 2234568", email: "chairman.nk03@fixkarachi.gos.pk" },
      { ucNo: "UC-04", name: "Mustafa Colony", chairman: "Muhammad Amir", contact: "+92 300 3234569", email: "chairman.nk04@fixkarachi.gos.pk" },
      { ucNo: "UC-05", name: "Kala School", chairman: "Atta Ur Rehman", contact: "+92 300 4234570", email: "chairman.nk05@fixkarachi.gos.pk" },
      { ucNo: "UC-06", name: "Khamiso Goth", chairman: "Rehmat Ali", contact: "+92 300 5234571", email: "chairman.nk06@fixkarachi.gos.pk" },
      { ucNo: "UC-07", name: "Madina Colony", chairman: "Abdul Ghaffar Chishti", contact: "+92 300 6234572", email: "chairman.nk07@fixkarachi.gos.pk" },
      { ucNo: "UC-08", name: "Shah Faisal", chairman: "Khalid Mehmood", contact: "+92 300 7234573", email: "chairman.nk08@fixkarachi.gos.pk" },
      { ucNo: "UC-09", name: "Abu Zar Ghaffari", chairman: "Muhammad Abbas Shaikh", contact: "+92 300 8234574", email: "chairman.nk09@fixkarachi.gos.pk" },
      { ucNo: "UC-10", name: "Godhra", chairman: "Faisal Ahmed", contact: "+92 300 9234575", email: "chairman.nk10@fixkarachi.gos.pk" },
      { ucNo: "UC-11", name: "Hakeem Ahsan", chairman: "Muhammad Ghazanfar Ali", contact: "+92 300 1134576", email: "chairman.nk11@fixkarachi.gos.pk" },
      { ucNo: "UC-12", name: "Kalyana", chairman: "Azeem Anwar", contact: "+92 300 1234577", email: "chairman.nk12@fixkarachi.gos.pk" },
      { ucNo: "UC-13", name: "Muhammad Shah", chairman: "Shahzaib Satti", contact: "+92 300 1334578", email: "chairman.nk13@fixkarachi.gos.pk" }
    ]
  },
  {
    name: "Gulberg",
    townChairman: "Nusratullah",
    ucs: [
      { ucNo: "UC-01", name: "Shafiq Mill", chairman: "Asim Makhdomi", contact: "+92 345 2234511", email: "chairman.gb01@fixkarachi.gos.pk" },
      { ucNo: "UC-02", name: "Samanabad", chairman: "Faisal Sheikh", contact: "+92 345 2234512", email: "chairman.gb02@fixkarachi.gos.pk" },
      { ucNo: "UC-03", name: "Waterpump", chairman: "Noman ul Haq", contact: "+92 345 2234513", email: "chairman.gb03@fixkarachi.gos.pk" },
      { ucNo: "UC-04", name: "Naseerabad", chairman: "Owais Baig", contact: "+92 345 2234514", email: "chairman.gb04@fixkarachi.gos.pk" },
      { ucNo: "UC-05", name: "Yaseenabad", chairman: "Arif Munir", contact: "+92 345 2234515", email: "chairman.gb05@fixkarachi.gos.pk" },
      { ucNo: "UC-06", name: "Azizabad", chairman: "Muhammad Ilyas", contact: "+92 345 2234516", email: "chairman.gb06@fixkarachi.gos.pk" },
      { ucNo: "UC-07", name: "Hussainabad", chairman: "Ilyas Memon", contact: "+92 345 2234517", email: "chairman.gb07@fixkarachi.gos.pk" },
      { ucNo: "UC-08", name: "Ayesha Manzil", chairman: "Shallal Ahmed", contact: "+92 345 2234518", email: "chairman.gb08@fixkarachi.gos.pk" }
    ]
  },
  {
    name: "Chanesar",
    townChairman: "Farhan Ghani",
    ucs: [
      { ucNo: "UC-01", name: "P.E.C.H.S-I", chairman: "Mr. Saif uddin", contact: "+92 333 1234511", email: "chairman.ch01@fixkarachi.gos.pk" },
      { ucNo: "UC-02", name: "P.E.C.H.S-II", chairman: "Mr. Irfan Allah", contact: "+92 333 1234512", email: "chairman.ch02@fixkarachi.gos.pk" },
      { ucNo: "UC-03", name: "Mehmoodabad", chairman: "Mr. Shahid Farman", contact: "+92 333 1234513", email: "chairman.ch03@fixkarachi.gos.pk" },
      { ucNo: "UC-04", name: "Manzoor Colony-I", chairman: "Mr. Munir Ahmed", contact: "+92 333 1234514", email: "chairman.ch04@fixkarachi.gos.pk" },
      { ucNo: "UC-05", name: "Manzoor Colony-II", chairman: "Mr. Shahid Ansari", contact: "+92 333 1234515", email: "chairman.ch05@fixkarachi.gos.pk" },
      { ucNo: "UC-06", name: "Akhtar Colony", chairman: "Mr. C.H. Hamid", contact: "+92 333 1234516", email: "chairman.ch06@fixkarachi.gos.pk" },
      { ucNo: "UC-07", name: "Azam Basti", chairman: "Mr. Tariq", contact: "+92 333 1234517", email: "chairman.ch07@fixkarachi.gos.pk" },
      { ucNo: "UC-08", name: "Chanesar Goth", chairman: "Mr. Orangzaib Taj", contact: "+92 333 1234518", email: "chairman.ch08@fixkarachi.gos.pk" }
    ]
  },
  {
    name: "Manghopir",
    townChairman: "Haji Nawaz Ali Brohi",
    ucs: [
      { ucNo: "UC-01", name: "Mai Garhi", chairman: "Saleem Brohi", contact: "+92 321 1234511", email: "chairman.mp01@fixkarachi.gos.pk" },
      { ucNo: "UC-02", name: "Manghopir", chairman: "Younus Mengal", contact: "+92 321 1234512", email: "chairman.mp02@fixkarachi.gos.pk" },
      { ucNo: "UC-03", name: "Pakhtoonabad", chairman: "Mufti Khalid", contact: "+92 321 1234513", email: "chairman.mp03@fixkarachi.gos.pk" },
      { ucNo: "UC-04", name: "Surjani Town", chairman: "Atif Hayat", contact: "+92 321 1234514", email: "chairman.mp04@fixkarachi.gos.pk" },
      { ucNo: "UC-05", name: "Yousuf Goth", chairman: "Ashraf", contact: "+92 321 1234515", email: "chairman.mp05@fixkarachi.gos.pk" },
      { ucNo: "UC-06", name: "Raheem Goth", chairman: "Zubaida Iqbal", contact: "+92 321 1234516", email: "chairman.mp06@fixkarachi.gos.pk" },
      { ucNo: "UC-07", name: "K.D.A Flats", chairman: "Umeed Ali Qazi", contact: "+92 321 1234517", email: "chairman.mp07@fixkarachi.gos.pk" },
      { ucNo: "UC-08", name: "Bhatti Goth", chairman: "Qadir Bux Brohi", contact: "+92 321 1234518", email: "chairman.mp08@fixkarachi.gos.pk" },
      { ucNo: "UC-09", name: "Khuda Ki Basti", chairman: "Irshad Mughal", contact: "+92 321 1234519", email: "chairman.mp09@fixkarachi.gos.pk" },
      { ucNo: "UC-10", name: "Liyari Expressway Resettlement", chairman: "Mustafa Badar", contact: "+92 321 1234520", email: "chairman.mp10@fixkarachi.gos.pk" },
      { ucNo: "UC-11", name: "Hassan Goth", chairman: "Mor Khan", contact: "+92 321 1234521", email: "chairman.mp11@fixkarachi.gos.pk" },
      { ucNo: "UC-12", name: "Gulshan-e-Mayman", chairman: "Syed Hilal Rehmani", contact: "+92 321 1234522", email: "chairman.mp12@fixkarachi.gos.pk" },
      { ucNo: "UC-13", name: "Mullah Hussain Brohi", chairman: "Anwer Brohi", contact: "+92 321 1234523", email: "chairman.mp13@fixkarachi.gos.pk" },
      { ucNo: "UC-14", name: "Kunwari Colony", chairman: "Muneeb", contact: "+92 321 1234524", email: "chairman.mp14@fixkarachi.gos.pk" },
      { ucNo: "UC-15", name: "M.P.R Colony", chairman: "Dr. Aziz", contact: "+92 321 1234525", email: "chairman.mp15@fixkarachi.gos.pk" },
      { ucNo: "UC-16", name: "Gabool Colony", chairman: "Haji Jumman Darban", contact: "+92 321 1234526", email: "chairman.mp16@fixkarachi.gos.pk" }
    ]
  },
  {
    name: "Nazimabad",
    townChairman: "Syed Muhammad Muzaffar",
    ucs: [
      { ucNo: "UC-01", name: "Paposh Nagar", chairman: "Aftab Hameed", contact: "0302-8259212", email: "chairman.nz01@fixkarachi.gos.pk" },
      { ucNo: "UC-02", name: "Abbasi Shaheed", chairman: "Ali Hassan Shaikh", contact: "0336-8221398", email: "chairman.nz02@fixkarachi.gos.pk" },
      { ucNo: "UC-03", name: "Hadi Market", chairman: "Muhammad Saleem", contact: "0322-6164943", email: "chairman.nz03@fixkarachi.gos.pk" },
      { ucNo: "UC-04", name: "Nazimabad No. 1", chairman: "Syed Muhammad Muzaffar", contact: "0346-3149195", email: "chairman.nz04@fixkarachi.gos.pk" },
      { ucNo: "UC-05", name: "Rizvia Society", chairman: "Aftab Latif", contact: "0311-3000295", email: "chairman.nz05@fixkarachi.gos.pk" },
      { ucNo: "UC-06", name: "Firdous Colony", chairman: "Abdul Khaliq", contact: "0333-3396207", email: "chairman.nz06@fixkarachi.gos.pk" },
      { ucNo: "UC-07", name: "Gulbahar", chairman: "Furqan Islam", contact: "0312-1117088", email: "chairman.nz07@fixkarachi.gos.pk" }
    ]
  },
  {
    name: "Ibrahim Hyderi",
    townChairman: "Nazir Ahmed Bhutto",
    ucs: [
      { ucNo: "UC-01", name: "Chaukhandi", chairman: "Imran Samoon", contact: "+92 313 1234501", email: "chairman.ih01@fixkarachi.gos.pk" },
      { ucNo: "UC-02", name: "Shah Latif Town", chairman: "Bashir Kalmati", contact: "+92 313 1234502", email: "chairman.ih02@fixkarachi.gos.pk" },
      { ucNo: "UC-03", name: "Cattle Colony", chairman: "Ghulam Hussain", contact: "+92 313 1234503", email: "chairman.ih03@fixkarachi.gos.pk" },
      { ucNo: "UC-04", name: "Majeed Colony", chairman: "Shafiq Alam", contact: "+92 313 1234504", email: "chairman.ih04@fixkarachi.gos.pk" },
      { ucNo: "UC-05", name: "Muzaffarabad", chairman: "Niaz Tanoli", contact: "+92 313 1234505", email: "chairman.ih05@fixkarachi.gos.pk" },
      { ucNo: "UC-06", name: "Muslimabad", chairman: "Sarfraz Baloch", contact: "+92 313 1234506", email: "chairman.ih06@fixkarachi.gos.pk" },
      { ucNo: "UC-07", name: "Sherpao Colony", chairman: "Saleem Khan", contact: "+92 313 1234507", email: "chairman.ih07@fixkarachi.gos.pk" },
      { ucNo: "UC-08", name: "Ibrahim Hyderi", chairman: "Mayor Murtaza Wahab", contact: "+92 313 1234508", email: "chairman.ih08@fixkarachi.gos.pk" },
      { ucNo: "UC-09", name: "Chashma", chairman: "Rafiq Dawood Jat", contact: "+92 313 1234509", email: "chairman.ih09@fixkarachi.gos.pk" },
      { ucNo: "UC-10", name: "Rehri Goth", chairman: "Yousuf Jat", contact: "+92 313 1234510", email: "chairman.ih10@fixkarachi.gos.pk" },
      { ucNo: "UC-11", name: "Ali Akber Shah", chairman: "Ali Akbar Jat", contact: "+92 313 1234511", email: "chairman.ih11@fixkarachi.gos.pk" }
    ]
  },
  {
    name: "Landhi",
    townChairman: "Abdul Jamil Khan",
    ucs: [
      { ucNo: "UC-01", name: "Labor Square", chairman: "Noor Hussain", contact: "0333-2127428", email: "chairman.lh01@fixkarachi.gos.pk" },
      { ucNo: "UC-02", name: "Zaman Town", chairman: "Muhammad Qasim Khan", contact: "0304-2141034", email: "chairman.lh02@fixkarachi.gos.pk" },
      { ucNo: "UC-03", name: "Shareef Colony", chairman: "Nadir Ali Khan Lodhi", contact: "0333-2214923", email: "chairman.lh03@fixkarachi.gos.pk" },
      { ucNo: "UC-04", name: "Kawaja Ajmeer", chairman: "Muhammad Idrees", contact: "0300-2557619", email: "chairman.lh04@fixkarachi.gos.pk" },
      { ucNo: "UC-05", name: "Bhutto Nagar", chairman: "Sarfraz Ahmed", contact: "0315-2658986", email: "chairman.lh05@fixkarachi.gos.pk" },
      { ucNo: "UC-06", name: "Farooq Villas", chairman: "Israr Ahmed Siddiqui", contact: "0312-2125185", email: "chairman.lh06@fixkarachi.gos.pk" },
      { ucNo: "UC-07", name: "Zaman Abad", chairman: "Mirza Farhan Baig", contact: "0333-2145770", email: "chairman.lh07@fixkarachi.gos.pk" },
      { ucNo: "UC-08", name: "Musarat Mohani Colony", chairman: "Muhammad Ayub Abbasi", contact: "0311-3311539", email: "chairman.lh08@fixkarachi.gos.pk" },
      { ucNo: "UC-09", name: "Nizam-e-Mustafa Colony", chairman: "Hafiz Anwar Elahi", contact: "0316-0018107", email: "chairman.lh09@fixkarachi.gos.pk" },
      { ucNo: "UC-10", name: "100 Quarter", chairman: "Abdul Hafeez", contact: "0346-8225488", email: "chairman.lh10@fixkarachi.gos.pk" }
    ]
  }
];

export function findUCByEmail(email: string): { town: string; uc: UCData } | null {
  const normalized = email.toLowerCase().trim();
  for (const town of KARACHI_TOWNS) {
    const uc = town.ucs.find(u => u.email.toLowerCase() === normalized);
    if (uc) {
      return { town: town.name, uc };
    }
  }
  return null;
}

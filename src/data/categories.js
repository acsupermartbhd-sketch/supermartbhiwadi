const categories = [
  {
    name: "Desktop",
    icon: "💻",
    children: ["Desktop", "Desktop CPU", "Desktop RAM (Memory)", "Graphic Card", "Cabinet", "Cabinet Fan", "Power Supply", "UPS", "UPS Batteries", "Motherboard", "Desktop Accessories", "Mouse", "Keyboard", "Speakers"],
  },
  {
    name: "Laptop",
    icon: "💻",
    children: ["Laptop", "Laptop RAM", "Laptop SSD", "Laptop Charger", "Laptop Battery", "Laptop Accessories"],
  },
  {
    name: "Networking",
    icon: "🌐",
    children: ["Cable", "Desktop Switch", "Router", "USB Wi-Fi Adapter", "Rack & Accessories", "Tools", "PoE Switch", "Fiber Switch", "Fiber Accessories", "Fiber Router", "Fiber Media Converter", "Fiber Patch Cord", "Fiber Module", "Access Point", "Range Extender"],
  },
  {
    name: "Printers",
    icon: "🖨️",
    children: ["Printer", "Scanner", "Ink Cartridge", "Toner Powder", "Toner / DMP Cartridge", "Ink Bottle", "Barcode Scanner"],
  },
  {
    name: "Security",
    icon: "🛡️",
    children: ["HD Camera", "HD DVR", "IP Camera", "IP NVR", "Biometrics", "Wi-Fi Camera", "Camera Accessories"],
  },
  {
    name: "Software",
    icon: "💿",
    children: ["Antivirus", "Windows", "Office", "Busy", "Accounting Software", "Utility Software"],
  },
  {
    name: "Storage",
    icon: "💾",
    children: ["Internal SSD", "External SSD", "External Hard Disk", "Pen Drive", "SD / Micro SD Card", "Computer Hard Disk", "Surveillance Hard Disk"],
  },
  {
    name: "Display",
    icon: "🖥️",
    children: ["LED / Monitor", "Presenter", "Pointer", "Wall Mount Kit", "HDMI Cable", "Display Cable", "Monitor Stand"],
  },
  {
    name: "Telecom",
    icon: "☎️",
    children: ["Telephone", "EPBX", "Telephone Cable", "Connectors", "Intercom", "Telecom Accessories"],
  },
  {
    name: "Accessories",
    icon: "🔌",
    children: ["Keyboard", "Mouse", "Speakers", "Headphones", "Webcam", "USB Hub", "Power Adapter", "Cables", "Other Accessories"],
  },
];

export const categoryOptions = categories.flatMap((category) => category.children);
export default categories;

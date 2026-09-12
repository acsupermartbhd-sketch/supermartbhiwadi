const categories = [
  {
    name: "Laptops & PC",
    icon: "💻",
    children: ["Laptops", "Desktop PC", "Gaming PC", "SSD", "Keyboard", "Mouse", "RAM", "Laptop Charger"],
  },
  {
    name: "Cameras",
    icon: "📷",
    children: ["Cameras", "Camera Lens", "Camera Cable", "Memory Card", "Tripod", "Camera Battery", "Camera Bag"],
  },
  {
    name: "CCTV Cameras",
    icon: "📹",
    children: ["CCTV Cameras", "DVR", "NVR", "CCTV Cable", "CCTV Adapter", "Hard Disk", "Camera Connector", "CCTV Power Supply"],
  },
  {
    name: "Printers",
    icon: "🖨️",
    children: ["All Printers", "Color Printers", "Laser Printers", "Ink Cartridges", "Toner", "Printer Cable", "Printer Parts"],
  },
  {
    name: "Monitors",
    icon: "🖥️",
    children: ["Monitors", "HDMI Cable", "Display Cable", "Monitor Stand"],
  },
  {
    name: "Audio & Accessories",
    icon: "🎧",
    children: ["Headphones", "Speakers", "Webcams", "USB Hub", "Power Adapter", "Other Accessories"],
  },
];

export const categoryOptions = categories.flatMap((category) => category.children);
export default categories;

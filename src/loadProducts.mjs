import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  writeBatch,
  getDocs,
} from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: "AIzaSyCEPg9adZvyDXK0bNsCPFdWxaK8LvidOhA",
  authDomain: "tucs-app.firebaseapp.com",
  projectId: "tucs-app",
  storageBucket: "tucs-app.firebasestorage.app",
  messagingSenderId: "1063093744951",
  appId: "1:1063093744951:web:a83b84fc1b0215f2e4d6b2",
  measurementId: "G-WRLJZPB3F7",
};

const rawProducts = [
  // Productos antiguos (bebidas sin alcohol)
  {
    nombre: "COMBO RED 1",
    descripcion: "6 Lata Red Bull 250ml + 1 Whisky JW Red Label 1L",
    detalle: "Combo especial con 6 latas de Red Bull y 1 botella de Whisky JW Red Label 1L",
    categoria: "Bebidas con alcohol",
    subcategoria: "Combos",
    proveedor: "MA distribución",
    precioCosto: 49000, // Precio especial de combo
    impuesto: 16,
    active: true,
    specialOffer: true,
    newArrival: true,
    featuredBrand: true,
    freeShipping: true,
    highlighted: true,
    rating: 4.8,
    tags: ["combo", "red bull", "whisky", "jw red label", "oferta"]
  },
  {
    nombre: "COMBO RED 2",
    descripcion: "5 Lata Red Bull 250ml + 1 Whisky JW Red Label 750ml",
    detalle: "Combo especial con 5 latas de Red Bull y 1 botella de Whisky JW Red Label 750ml",
    categoria: "Bebidas con alcohol",
    subcategoria: "Combos",
    proveedor: "MA distribución",
    precioCosto: 43100, // Precio especial de combo
    impuesto: 16,
    active: true,
    specialOffer: true,
    newArrival: true,
    featuredBrand: true,
    freeShipping: true,
    highlighted: true,
    rating: 4.7,
    tags: ["combo", "red bull", "whisky", "jw red label", "oferta"]
  },
  {
    nombre: "COMBO JAGERMEISTER",
    descripcion: "5 Lata Red Bull 250ml + 1 Jägermeister 700ml",
    detalle: "Combo especial con 5 latas de Red Bull y 1 botella de Jägermeister 700ml",
    categoria: "Bebidas con alcohol",
    subcategoria: "Combos",
    proveedor: "MA distribución",
    precioCosto: 48500, // Precio especial de combo
    impuesto: 16,
    active: true,
    specialOffer: true,
    newArrival: true,
    featuredBrand: true,
    freeShipping: true,
    highlighted: true,
    rating: 4.6,
    tags: ["combo", "red bull", "jagermeister", "oferta"]
  },
  {
    nombre: "COMBO DAMONJ",
    descripcion: "5 Lata Red Bull 250ml + 1 Damonjag 1L",
    detalle: "Combo especial con 5 latas de Red Bull y 1 botella de Damonjag 1L",
    categoria: "Bebidas con alcohol",
    subcategoria: "Combos",
    proveedor: "MA distribución",
    precioCosto: 36700, // Precio especial de combo
    impuesto: 16,
    active: true,
    specialOffer: true,
    newArrival: true,
    featuredBrand: true,
    freeShipping: true,
    highlighted: true,
    rating: 4.5,
    tags: ["combo", "red bull", "damonjag", "oferta"]
  },
  {
    nombre: "COMBO SMIRNOFF",
    descripcion: "1 Smirnoff Raspberry 750ml + 1 Smirnoff Tropical Fruit 700ml + 8 Lata Speed XL 500ml",
    detalle: "Combo especial con 2 botellas de Smirnoff y 8 latas de Speed XL",
    categoria: "Bebidas con alcohol",
    subcategoria: "Combos",
    proveedor: "MA distribución",
    precioCosto: 44600, // Precio especial de combo
    impuesto: 16,
    active: true,
    specialOffer: true,
    newArrival: true,
    featuredBrand: true,
    freeShipping: true,
    highlighted: true,
    rating: 4.7,
    tags: ["combo", "smirnoff", "speed", "oferta"]
  },
  {
    nombre: "COMBO SKYY",
    descripcion: "8 Lata Speed XL 500ml + 2 Skyy Raspberry 750ml",
    detalle: "Combo especial con 8 latas de Speed XL y 2 botellas de Skyy Raspberry",
    categoria: "Bebidas con alcohol",
    subcategoria: "Combos",
    proveedor: "MA distribución",
    precioCosto: 45500, // Precio especial de combo
    impuesto: 16,
    active: true,
    specialOffer: true,
    newArrival: true,
    featuredBrand: true,
    freeShipping: true,
    highlighted: true,
    rating: 4.8,
    tags: ["combo", "skyy", "speed", "oferta"]
  }
];

// Función para transformar los datos al formato de Firebase
function transformProduct(product) {
  const precioVenta = product.precioCosto * (1 + product.impuesto / 100);
  const imagePath = `/images/${product.nombre.toLowerCase().replace(/\s+/g, '-')}.png`;
  
  return {
    title: product.nombre,
    name: product.nombre,
    description: product.descripcion,
    detail: product.detalle,
    price: precioVenta,
    category: product.categoria.toLowerCase(),
    subcategory: product.subcategoria.toLowerCase(),
    provider: product.proveedor,
    stock: 12, // Valor por defecto
    rating: product.rating,
    active: product.active,
    specialOffer: product.specialOffer,
    newArrival: product.newArrival,
    featuredBrand: product.featuredBrand,
    freeShipping: product.freeShipping,
    highlighted: product.highlighted,
    discount: {
      amount: 0,
      percentage: 0
    },
    srcUrl: imagePath,
    gallery: [imagePath, imagePath, imagePath],
    tags: product.tags,
    images: product.imagenes || [],
    sales: product.ventas || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cargarProductos() {
  const batch = writeBatch(db);
  const productsCollection = collection(db, "products");

  // Primero obtenemos todos los productos existentes
  const snapshot = await getDocs(productsCollection);
  const existingProducts = new Map();
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    existingProducts.set(data.name, { id: doc.id, ...data });
  });

  // Filtramos los productos nuevos (combos)
  const newProducts = rawProducts.filter(product => 
    product.subcategoria === "Combos"
  );

  // Agregamos los nuevos productos
  newProducts.forEach((producto) => {
    const transformedProduct = transformProduct(producto);
    const productDoc = doc(productsCollection);
    batch.set(productDoc, transformedProduct);
  });

  try {
    await batch.commit();
    console.log("✅ Productos cargados exitosamente");
  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
  }
}

cargarProductos(); 
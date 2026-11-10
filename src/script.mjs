// src/script.js

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  writeBatch,
} from "firebase/firestore/lite"; // usamos 'lite' para Node

import { allProducts } from "./products.js"; // o el archivo donde tenés los productos

const firebaseConfig = {
    apiKey: "AIzaSyCEPg9adZvyDXK0bNsCPFdWxaK8LvidOhA",
    authDomain: "tucs-app.firebaseapp.com",
    projectId: "tucs-app",
    storageBucket: "tucs-app.firebasestorage.app",
    messagingSenderId: "1063093744951",
    appId: "1:1063093744951:web:a83b84fc1b0215f2e4d6b2",
    measurementId: "G-WRLJZPB3F7",
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cargarProductos() {
  const batch = writeBatch(db);
  const productsCollection = collection(db, "products");

  allProducts.forEach((producto) => {
    const newDoc = doc(productsCollection, producto.id);
    batch.set(newDoc, producto);
  });

  try {
    await batch.commit();
    console.log("✅ Productos agregados exitosamente");
  } catch (error) {
    console.error("❌ Error al agregar productos:", error);
  }
}

cargarProductos();

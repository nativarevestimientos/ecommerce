import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

async function verifyFirebaseConnection() {
  try {
    console.log('Verificando conexión a Firebase...');
    
    // Verificar colección de productos
    const productsCol = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCol);
    console.log(`Encontrados ${productsSnapshot.size} productos`);
    
    if (productsSnapshot.size > 0) {
      const firstProduct = productsSnapshot.docs[0];
      console.log('Ejemplo de producto:', firstProduct.data());
    }
    
    // Verificar colección de carritos
    const cartsCol = collection(db, 'carts');
    const cartsSnapshot = await getDocs(cartsCol);
    console.log(`Encontrados ${cartsSnapshot.size} carritos`);
    
    if (cartsSnapshot.size > 0) {
      const firstCart = cartsSnapshot.docs[0];
      console.log('Ejemplo de carrito:', firstCart.data());
    }
    
    console.log('Verificación completada con éxito');
  } catch (error) {
    console.error('Error al verificar la conexión:', error);
    process.exit(1);
  }
}

verifyFirebaseConnection(); 
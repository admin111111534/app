import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function dodajArtikal(artikal) {
  await addDoc(collection(db, "inventory"), artikal);
}
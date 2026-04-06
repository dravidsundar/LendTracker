import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { ref, get } from "firebase/database";
import { db } from "../../firebase-config.js";
import { setUserData } from "../../learn/slice.js";
export default function DataFetcherWrapper({ children, user }) {
  const dispatch = useDispatch();
  useEffect(() => {
    async function fetchData(userId) {
      const snapshot = await get(ref(db, `Users/${userId}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        dispatch(
          setUserData({
            allStats: data.AllStats || {},
            clientData: data.ClientData || {},
            deletedClientData: data.DeletedClientData || {},
          })
        );
      } else {
        console.log("No data found for user:", userId);
      }
    }
    fetchData(user);
  }, [dispatch, user]);
  return children;
}

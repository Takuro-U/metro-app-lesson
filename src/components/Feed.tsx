import React, { useState, useEffect } from "react";
import styles from "./Feed.module.css";
import { useSelector } from "react-redux";
import { selectUser } from "../features/userSlice";
import { auth, db } from "../firebase";
import TweetInput from "./TweetInput";
import Posts from "./Posts";

const Feed: React.FC = () => {
  const user = useSelector(selectUser);
  const [posts, setPosts] = useState([
    {
      id: "",
      avatar: "",
      countThumbUp: 0,
      image: "",
      text: "",
      timestamp: null,
      timestampEdit: null,
      uid: "",
      username: "",
      usernameThumbUp: [],
    },
  ]);
  useEffect(() => {
    const unSub = db
      .collection("posts")
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) =>
        setPosts(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            avatar: doc.data().avatar,
            countThumbUp: doc.data().countThumbUp,
            image: doc.data().image,
            text: doc.data().text,
            timestamp: doc.data().timestamp,
            timestampEdit: doc.data().timestampEdit,
            uid: doc.data().uid,
            username: doc.data().username,
            usernameThumbUp: doc.data().usernameThumbUp,
          }))
        )
      );
    return () => {
      unSub();
    };
  }, []);
  return (
    <div className={styles.feed}>
      <span className={styles.user_header}>
        <h1 className={styles.login}>{user.displayName}</h1>
        <button onClick={() => auth.signOut()} className={styles.logout_btn}>
          Logout
        </button>
      </span>
      <TweetInput />

      {posts[0]?.id && (
        <>
          {posts.map((post) => (
            <Posts
              key={post.id}
              postId={post.id}
              avatar={post.avatar}
              countThumbUp={post.countThumbUp}
              image={post.image}
              text={post.text}
              timestamp={post.timestamp}
              timestampEdit={post.timestampEdit}
              uid={post.uid}
              username={post.username}
              usernameThumbUp={post.usernameThumbUp}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default Feed;

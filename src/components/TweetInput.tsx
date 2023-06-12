import React, { useState, useEffect } from "react";
import styles from "./TweetInput.module.css";
import { useSelector } from "react-redux";
import { selectUser } from "../features/userSlice";
import { Button, IconButton } from "@material-ui/core";
import { auth, storage, db } from "../firebase";
import firebase from "firebase/app";
import AddAPhotoIcon from "@material-ui/icons/AddAPhoto";

const TweetInput: React.FC = () => {
  const user = useSelector(selectUser);
  const [tweetMsg, setTweetMsg] = useState("");
  const [tweetImg, setTweetImg] = useState<File | null>(null);
  const sendTweet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (tweetImg) {
      const S =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const N = 16;
      const randomChar = Array.from(crypto.getRandomValues(new Uint32Array(N)))
        .map((n: any) => S[n % S.length])
        .join("");
      const fileName = randomChar + "_" + tweetImg.name;
      const uploadTweetImg = storage.ref(`images/${fileName}`).put(tweetImg);
      uploadTweetImg.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        () => {},
        (err) => {
          alert(err.message);
        },
        async () => {
          await storage
            .ref("images")
            .child(fileName)
            .getDownloadURL()
            .then(async (url) => {
              await db.collection("posts").add({
                countThumbUp: 0,
                image: url,
                text: tweetMsg,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                timestampEdit: null,
                uid: user.uid,
                username: user.displayName,
                usernameThumbUp: [],
              });
            });
        }
      );
    } else {
      db.collection("posts").add({
        countThumbUp: 0,
        image: "",
        text: tweetMsg,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        timestampEdit: null,
        uid: user.uid,
        username: user.displayName,
        usernameThumbUp: [],
      });
    }
    setTweetMsg("");
    setTweetImg(null);
    console.log(tweetImg);
  };
  const onChangeImageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files![0]) {
      setTweetImg(e.target.files![0]);
      e.target.value = "";
    }
  };
  return (
    <form onSubmit={sendTweet}>
      <div className={styles.tweet_form}>
        <input
          className={styles.tweet_input}
          placeholder="What's happening?"
          type="text"
          value={tweetMsg}
          onChange={(e) => setTweetMsg(e.target.value)}
        />

        <IconButton>
          <label>
            <AddAPhotoIcon
              className={
                tweetImg ? styles.tweet_addIconLoaded : styles.tweet_addIcon
              }
            />
            <input
              className={styles.tweet_hiddenForm}
              type="file"
              onChange={onChangeImageHandler}
            />
          </label>
        </IconButton>
        <Button
          className={
            tweetMsg ? styles.tweet_sendBtn : styles.tweet_sendBtnDisable
          }
          type="submit"
          disabled={!tweetMsg}
        >
          Tweet➡
        </Button>
      </div>
    </form>
  );
};

export default TweetInput;

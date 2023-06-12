import React, { useEffect, useState } from "react";
import styles from "./Posts.module.css";
import { useSelector } from "react-redux";
import { selectUser } from "../features/userSlice";
import { Button, IconButton } from "@material-ui/core";
import { db, storage } from "../firebase";
import firebase from "firebase";
import EditIcon from "@material-ui/icons/Edit";
import SendIcon from "@material-ui/icons/Send";
import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import MessageIcon from "@material-ui/icons/Message";
import AddAPhotoIcon from "@material-ui/icons/AddAPhoto";

interface PROPS {
  postId: string;
  avatar: string;
  countThumbUp: number;
  image: string;
  text: string;
  timestamp: any;
  timestampEdit: any;
  uid: string;
  username: string;
  usernameThumbUp: Array<string>;
}

interface COMMENT {
  id: string;
  avatar: string;
  text: string;
  timestamp: any;
  timestampEdit: any;
  uid: string;
  username: string;
}

const Posts: React.FC<PROPS> = (props) => {
  const user = useSelector(selectUser);
  const [tweetImg, setTweetImg] = useState<File | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isOpenComment, setIsOpenComment] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<COMMENT[]>([
    {
      id: "",
      avatar: "",
      text: "",
      timestamp: null,
      timestampEdit: null,
      uid: "",
      username: "",
    },
  ]);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const countThumbUp = async (checkId: string, inputNumber: number) => {
    db.collection("posts").doc(checkId).update({
      countThumbUp: inputNumber,
    });
  };

  const checkUserThumbUp = async (checkId: string, searchUser: string) => {
    const docRef = await db.collection("posts").doc(checkId).get();
    const thumbUpList = docRef.data()?.usernameThumbUp;
    for (let i = 0; i < thumbUpList.length; i++) {
      if (thumbUpList[i] == searchUser) {
        return i;
      }
    }
    return null;
  };

  const addOrDeleteUserThumbUp = async (
    checkId: string,
    searchUser: string
  ) => {
    const docRef = await db.collection("posts").doc(checkId).get();
    const thumbUpList = docRef.data()?.usernameThumbUp;
    const resultOfCheck =
      (await checkUserThumbUp(checkId, searchUser)) === null;
    if (resultOfCheck) {
      thumbUpList.push(user.uid);
      db.collection("posts").doc(checkId).update({
        usernameThumbUp: thumbUpList,
      });
    } else {
      const index = await checkUserThumbUp(checkId, searchUser);
      thumbUpList.splice(index, 1);
      db.collection("posts").doc(checkId).update({
        usernameThumbUp: thumbUpList,
      });
    }
    countThumbUp(checkId, thumbUpList.length);
    console.log(props.countThumbUp);
  };

  const onChangeImageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files![0]) {
      setTweetImg(e.target.files![0]);
      e.target.value = "";
    }
  };

  const changeTweet = () => {
    setIsEditMode(!isEditMode);
    setCurrentText(props.text);
  };

  const sendChangedTweet = () => {
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
              await db.collection("posts").doc(props.postId).update({
                image: url,
                text: currentText,
                timestampEdit: firebase.firestore.FieldValue.serverTimestamp(),
              });
            });
        }
      );
    } else {
      if (props.text != currentText) {
        db.collection("posts").doc(props.postId).update({
          text: currentText,
          timestampEdit: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
    setIsEditMode(!isEditMode);
  };

  const deleteTweet = () => {
    db.collection("posts").doc(props.postId).delete();
  };

  const sendNewComment = () => {
    db.collection("posts").doc(props.postId).collection("comments").add({
      text: comment,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      uid: user.uid,
      username: user.displayName,
    });
    setComment("");
  };

  const deleteComment = (checkPostId: string) => {
    db.collection("posts")
      .doc(props.postId)
      .collection("comments")
      .doc(checkPostId)
      .delete();
  };

  useEffect(() => {
    const fetchThumbUpStatus = async () => {
      const result = await checkUserThumbUp(props.postId, user.uid);
      setIsLiked(result !== null);
    };

    fetchThumbUpStatus();
  }, [checkUserThumbUp(props.postId, user.uid)]);

  useEffect(() => {
    const unSub = db
      .collection("posts")
      .doc(props.postId)
      .collection("comments")
      .orderBy("timestamp", "asc")
      .onSnapshot((snapshot) => {
        setComments(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            avatar: doc.data().avatar,
            text: doc.data().text,
            timestamp: doc.data().timestamp,
            timestampEdit: doc.data().timestampEdit,
            uid: doc.data().uid,
            username: doc.data().username,
          }))
        );
      });

    return () => {
      unSub();
    };
  }, [props.postId]);

  return (
    <>
      <div className={styles.post}>
        <div className={styles.post_body}>
          <h3 className={styles.post_header}>
            <span>{props.username}</span>
            <span>{new Date(props.timestamp?.toDate()).toLocaleString()}</span>
          </h3>
          {props.timestampEdit && (
            <h4>
              ({new Date(props.timestampEdit?.toDate()).toLocaleString()}
              編集済)
            </h4>
          )}
          <div className={styles.post_text}>
            {isEditMode ? (
              <form onSubmit={handleSubmit}>
                <input
                  className={styles.post_editForm}
                  type="text"
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                />
                <IconButton>
                  <label>
                    <AddAPhotoIcon
                      className={
                        tweetImg
                          ? styles.tweet_addIconLoaded
                          : styles.tweet_addIcon
                      }
                    />
                    <input
                      className={styles.tweet_hiddenForm}
                      type="file"
                      onChange={onChangeImageHandler}
                    />
                  </label>
                </IconButton>
                <IconButton
                  className={
                    currentText ? styles.post_button : styles.post_buttonDisable
                  }
                  type="submit"
                  onClick={() => sendChangedTweet()}
                >
                  <label>
                    <SendIcon />
                  </label>
                </IconButton>
              </form>
            ) : (
              <p>{props.text}</p>
            )}
          </div>
        </div>
        {props.image && (
          <div className={styles.post_tweetImage}>
            <img src={props.image} alt="tweet" />
          </div>
        )}
        <Button
          onClick={() =>
            user.uid != props.uid &&
            addOrDeleteUserThumbUp(props.postId, user.uid)
          }
        >
          <ThumbUpIcon className={isLiked ? styles.liked : styles.not_liked} />

          <p>{props.countThumbUp}</p>
        </Button>
        <Button onClick={() => setIsOpenComment(!isOpenComment)}>
          <MessageIcon />
        </Button>
        {user.uid == props.uid && (
          <>
            <Button onClick={changeTweet}>
              <EditIcon
                className={isEditMode ? styles.on_edit : styles.off_edit}
              />
            </Button>
            <Button onClick={deleteTweet}>[DELETE]</Button>
          </>
        )}
      </div>
      <div className={styles.post_commentArea}>
        {isOpenComment && (
          <div>
            {comments.map((com) => (
              <div key={com.id} className={styles.post_comment}>
                <h4 className={styles.post_commentHeader}>
                  <span>@{com.username}</span>
                  <span>
                    {new Date(com.timestamp?.toDate()).toLocaleString()}
                  </span>
                </h4>
                <p className={styles.post_commentText}>{com.text}</p>
                {user.uid == com.uid && (
                  <button
                    className={styles.post_deleteBtn}
                    onClick={() => deleteComment(com.id)}
                  >
                    [DELETE]
                  </button>
                )}
              </div>
            ))}
            <form className={styles.post_form} onSubmit={handleSubmit}>
              <input
                className={styles.post_commentForm}
                type="text"
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setComment(e.target.value)
                }
              />
              <button
                type="submit"
                className={
                  comment
                    ? styles.post_commentButton
                    : styles.post_commentButtonDisable
                }
                disabled={!comment}
                onClick={sendNewComment}
              >
                <SendIcon />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default Posts;

# Module

### _Auth_

- [x] localRegister \* -t
- [x] localLogin \* -t
- [x] logout \* -t
- [x] refresh \* -t
- [ ] passwordReset
- [ ] verifyEmail

---

### _User_

- [x] getUserById -M ? freunde suchen? Username?
- [x] getAllUsers -M
- [x] getMe
- [x] updateUser
- [x] updateMe
- [x] updatePassword -U
- [ ] applyForAuthor
- [ ] deleteMyAccout
- [ ] deactivateMyAccount
- [ ] deleteUser -M
- [ ] restoreUser -M

---

### _Artikel oder Post_

- [ ] getAllPosts -M ?
- [ ] getPostById | getPostByName (ist okay wenn mehrere)
- [ ] createPost
- [ ] updatePost
- [ ] removePost -U \* sollte auch für Autor gehen
- [ ] deletePost -M
- [ ] getAllPostsByUserId -M
- [ ] getAllPostsByCategory
- [ ] getAllPostsByTag
- [ ] getPopularPosts
- [ ] getAllReadPostOfUser

---

### _Readlist_

!! Model muss noch erstellt werden

- [ ] addPostToReadlist
- [ ] getAllReadPosts
- [ ] removePostFromReadlist

---

### _Kommentare_

- [ ] getAllComments
  - byUser -M
  - byPost (filter sollten optional sein einsetzbar sind)
- [ ] getCommentById ? unnötig - M
- [ ] createComment
- [ ] updateComment
- [ ] removeComment - U \* sollte auch für Autor gehen
- [ ] deleteComment - M

---

### _Rating_

- [ ] addLike \* toggle mit add und remove
- [ ] addDislike \* toggle mit add und remove
- [ ] getRatingByPostId
- [ ] getRatingByUserId -M

---

### _Freunde_

- [ ] getAllFriends
- [ ] getFriendById ?
- [ ] addFriend
- [ ] removeFriend
- [ ] sendFriendRequest
- [ ] cancelFriendRequest
- [ ] acceptFriendRequest
- [ ] rejectFriendRequest

? eigentes Modul?

- [ ] blockUser
- [ ] unblockUser

---

### _Tickets_

- [ ] getAllTickets
  - hier mit optional filter aber dafault open
- [ ] getAllTicketsByModeratorId
- [ ] getAllTicketsByUserId
- [ ] takeTicket -M
- [ ] getTicketById -M
- [ ] updateTicket ? updaten das Betreffs -> Aufforderungen
- [ ] createTicket

---

### _Moderation_

- [ ] takeTicket
- [ ] closeTicket
- [ ] reopenTicket
- [ ] openModLog ? wichtig oder?
      sonstige Funktionen werden von anderen Modulen abgedeckt:
- erstellen von Autoren über updateUser
- löschen von Usern über deleteUser
- löschen von Posts über deletePost
- löschen von Kommentaren über deleteComment
- löschen von Tickets über deleteTicket
- löschen von Likes/Dislikes über deleteRating
- löschen von Freundschaftsanfragen über deleteFriendRequest

### Legende

- Moderator Funktion = M
- Tokenfunktion = t
- User Funktion = U

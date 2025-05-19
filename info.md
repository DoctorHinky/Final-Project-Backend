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
- [x] getUserByUserName
- [x] getMe
- [x] updateUser
- [x] updateMe
- [x] updatePassword -U
- [ ] applyForAuthor
- [x] createModerator
- [x] deleteMyAccout
- [x] deactivateMyAccount
- [x] reactivateMyAccount
- [x] deleteUser -M
- [x] restoreUser -M
- [?] deleteUserForever -A

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

### _Applications_

- [ ] sendApplication -U
- [ ] cancelApplication -U
- [ ] getAllApplications -M
- [ ] getApplicationById -M ? unnötig kein UseCase
- [ ] getApplicationByUserId -M
- [ ] blockUserForApplication -M
- [ ] unblockUserForApplication -M

- [ ] takeApplication -M -> damit ändert sich der Status auf in_progress
- [ ] acceptApplication -M -> hier kann dann eine automatische Email an den User gesendet werden
- [ ] rejectApplication -M -> hier kann dann eine automatische Email an den User gesendet werden

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

- [x] createTicket -> einstiegspunkt
- [x] getTickets -> hier mit optional filter aber dafault open
- [x] getAllTicketsByModeratorId
- [x] getAllTicketsByUserId
- [x] getMyTickets
- [x] takeTicket -M
- [x] reassignTicket ? bei Krankheit oder interessenkonflikten
- [x] getTicketById -M
- [x] cancelTicket -U -> wenn das Problem sich erledigt hat
- [x] closeTicket -M + U

---

### _Moderation_

- [x] takeTicket
- [x] closeTicket
- [?] reopenTicket
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

### Cronjobs

- [ ] cloudinary-cleanup -> profilbilder, posts bilder
- [ ] delete old thinks -> das muss in jedes modul rein
- [ ] closed tickets delete

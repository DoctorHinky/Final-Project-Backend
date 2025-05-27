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
- [x] createModerator
- [x] deleteMyAccout
- [x] deactivateMyAccount
- [x] reactivateMyAccount
- [x] deleteUser -M
- [x] restoreUser -M
- [?] deleteUserForever -A

---

### _Artikel oder Post_

- [x] getAllPosts -M ?
- [x] getPostById | getPostByName (ist okay wenn mehrere)
- [x] createPost
- [x] updatePost
- [x] removePost -U \* sollte auch für Autor gehen
- [x] deletePost -M
- [x] getAllPostsByUserId -M
- [x] getAllPostsByCategory
- [x] getAllPostsByTag
- [x] getPopularPosts
- [ ] getAllReadPostOfUser

---

### _Readlist_

!! Model muss noch erstellt werden

- [ ] addPostToReadlist
- [ ] getAllReadPosts
- [ ] removePostFromReadlist

---

### _Kommentare_

- [x] getAllComments
  - [x] byUser -M
  - [x] byPost (filter sollten optional sein einsetzbar sind)
- [x] getCommentById ? unnötig - M
- [x] createComment
- [x] updateComment
- [x] removeComment - U \* sollte auch für Autor gehen
- [x] deleteComment - M

---

### _Rating_

- [x] addLike \* toggle mit add und remove
- [x] addDislike \* toggle mit add und remove
- [x] getRatingByPostId

---

### _Applications_

- [x] sendApplication -U
- [x] cancelApplication -U
- [x] getAllApplications -M
- [x] getApplicationById -M ? unnötig kein UseCase
- [x] getApplicationByUserId -M
- [x] blockUserForApplication -M
- [x] unblockUserForApplication -M

- [x] takeApplication -M -> damit ändert sich der Status auf in_progress
- [x] acceptApplication -M -> hier kann dann eine automatische Email an den User gesendet werden
- [x] rejectApplication -M -> hier kann dann eine automatische Email an den User gesendet werden

---

### _Freunde_

- [x] getAllFriends
- [x] getFriendById ?
- [x] addFriend
- [x] removeFriend
- [x] sendFriendRequest
- [x] cancelFriendRequest
- [x] acceptFriendRequest
- [x] rejectFriendRequest

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

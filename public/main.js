window.addEventListener( 'load' , function() {
  Vue.prototype.axios = axios;
  let app = new Vue( {
    el: '#app',
    data: {
      hereBooks: {},
      awayBooks: {},
      friends: {},
      keyToBook: {},
      // keyToFriend: {},
      booksOf: {},
      isSet: {},
      loaded: false,
      booksThatMatch: [0, 0],
      friendsThatMatch: [0],

      timeoutOf: {},
      timeoutTimeSet: 1500,
      timeoutTimeUnset: 1000,

      adminTitle: "",
      adminAuthor: "",
      adminGenres: "",
      adminLink: "",
      adminName: "",

      showLend: false,
      lendBookKey: null
    },
    created: function() {
      this.axios.get( '/api/books' )
        .then( (_response) => {
          this.hereBooks = _response.data.data;
      } );

      this.axios.get( '/api/awayBooks' )
        .then( (_response) => {
          this.awayBooks = _response.data.data;
      } );

      this.axios.get( '/api/friends' )
        .then( (_response) => {
          this.friends = _response.data.data;
      } );

      timeoutTime = 1000;
      setTimeout(() => {
        // console.log(this.hereBooks);
        // console.log(this.awayBooks);
        for (var key in this.hereBooks) {
          // console.log(key);
          if (!this.hereBooks.hasOwnProperty(key)) {
            continue;
          }

          book = this.hereBooks[key];
          this.keyToBook[key] = book;
        }

        for (var key in this.awayBooks) {
          if (!this.awayBooks.hasOwnProperty(key)) {
            continue;
          }

          book = this.awayBooks[key];
          this.keyToBook[key] = book;

          // console.log(this.booksOf[book.holderId]);
          if (this.booksOf[book.holderKey] == undefined) {
            this.booksOf[book.holderKey] = [];
          }
          this.booksOf[book.holderKey].push(key);
        }

        // for (var key in this.friends) {
        //   if (!this.friends.hasOwnProperty(key)) {
        //     continue;
        //   }

        //   friend = this.friends[key];
        //   this.keyToFriend[key] = friend;
        // }

        this.loaded = true;
      }, timeoutTime);

    },

    methods: {
      remove: function( _id ) {
        this.axios.delete( `/api/currency/${_id}` )
          .then( () => {
            Vue.delete( this.currency , _id );
          } );
      },

      edit: function( _id ) {
        let io = Object.assign( {} , this.currency[_id] );
        this.input = io;
        this.editId = _id;
      },

      addBook: function() {
        let obj = {
          bookName: this.adminTitle,
          author: this.adminAuthor,
          genres: this.adminGenres.split(", "),
          pictureLink: this.adminLink,
          holderKey: -1
        };

        // console.log(obj);

        axios.post( '/api/books' , obj )
          .then( _response => {
            if ( _response.data.ret === "OK" ) {
              let key = _response.data.data.replace("books/", "");
              Vue.set( this.hereBooks , key , obj );
              Vue.set( this.keyToBook , key , obj );

              // console.log(key); ////
            }
          } );
      },

      deleteBook: function(bookKey) {
        if (confirm("Are you sure you want to delete this book?") == false) {
          return;
        }

        // console.log(this.hereBooks[bookKey]);
        // console.log(this.keyToBook[bookKey]);

        this.axios.delete( `/api/books/${bookKey}` )
          .then( () => {
          Vue.delete(this.keyToBook, bookKey);
          Vue.delete(this.hereBooks, bookKey);
          // delete this.keyToBook[bookKey];
          // delete this.hereBooks[bookKey];
        } );
      },

      importBook: function(bookKey, isAwayBook) {
        if (confirm("Are you sure you want to import into this book?") == false) {
          return;
        }

        let obj = {
          bookName: this.adminTitle,
          author: this.adminAuthor,
          genres: this.adminGenres.split(", "),
          pictureLink: this.adminLink,
          holderKey: -1
        };

        Vue.set(this.hereBooks, bookKey, obj);
        Vue.set(this.keyToBook, bookKey, obj);
        if (isAwayBook) {
          axios.put( `/api/awayBooks/${bookKey}` , obj );
        }
        else {
          axios.put( `/api/books/${bookKey}` , obj );
        }
      },

      exportBook: function(bookKey) {
        if (confirm("Are you sure you want to export this book?") == false) {
          return;
        }

        this.adminTitle = this.keyToBook[bookKey].bookName;
        this.adminAuthor = this.keyToBook[bookKey].author;
        this.adminGenres = this.keyToBook[bookKey].genres.join(", ");
        this.adminLink = this.keyToBook[bookKey].pictureLink;

        updateImage(this.keyToBook[bookKey].pictureLink);
      },

      unlendBook: function(bookKey, alreadyConfirmed) {
        let answer;
        if (!alreadyConfirmed) {
          answer = confirm("Are you sure you want to unlend this book?");
        }
        else {
          answer = true;
        }

        if (answer == false) {
          return;
        }

        let book = this.keyToBook[bookKey];

        // update booksOf,
        let arr = this.booksOf[this.keyToBook[bookKey].holderKey];
        Vue.delete(arr, arr.indexOf(bookKey));
        // delete from awayBooks, keyToBook
        Vue.delete(this.awayBooks, bookKey);
        Vue.delete(this.keyToBook, bookKey);

        // delete from server
        this.axios.delete( `/api/awayBooks/${bookKey}` )
          .then( () => {
        } );

        book.holderKey = -1;

        axios.post( '/api/books' , book )
          .then( _response => {
            if ( _response.data.ret === "OK" ) {
              let newKey = _response.data.data.replace("books/", "");
              Vue.set( this.hereBooks , newKey , book );
              Vue.set( this.keyToBook , newKey , book );

              // console.log(newKey); ////
            }
          } );
      },

      showLendBook: function(bookKey) {
        this.showLend = true;
        this.lendBookKey = bookKey;
      },

      lendBook: function(bookKey) {
        this.showLend = false;

        let select = document.querySelector("#lend select");
        let friendKey = select.options[select.selectedIndex].value;
        // console.log(friendKey);

        let book = this.keyToBook[bookKey];

        // delete from hereBooks, keyToBook
        Vue.delete(this.hereBooks, bookKey);
        Vue.delete(this.keyToBook, bookKey);

        // delete from server
        this.axios.delete( `/api/books/${bookKey}` )
          .then( () => {
        } );

        book.holderKey = friendKey;

        axios.post( '/api/awayBooks' , book )
          .then( _response => {
            if ( _response.data.ret === "OK" ) {
              let newKey = _response.data.data.replace("awaybooks/", "");
              // console.log(newKey); ////
              // console.log(book); ////
              Vue.set( this.awayBooks, newKey, book );
              Vue.set( this.keyToBook, newKey, book );

              // update booksOf
              if (this.booksOf.hasOwnProperty(friendKey) == false) {
                this.booksOf[friendKey] = [];
              }
              this.booksOf[friendKey].push(newKey);
              this.forceUpdate();
            }
        } );

      },

      filterBook: function(bookKey, counterIndex) {
        searchString = document.getElementById("searchString").value;

        if (searchString == null || searchString == "") {
          this.booksThatMatch[counterIndex] += 1;
          return true;
        }

        var radioValue = null;
        var arr = document.getElementsByName("searchType");
        for (var i = 0; i < arr.length; ++i) {
          if (arr[i].checked) {
            radioValue = arr[i].value;
            break;
          }
        }

        // console.log(searchString);
        // console.log(radioValue);
        // console.log(bookKey);

        if (radioValue == "title") {
          if (this.keyToBook[bookKey].bookName.toLowerCase().includes(searchString.toLowerCase())) {
            this.booksThatMatch[counterIndex] += 1;
            return true;
          }
        }
        else if (radioValue == "author") {
          if (this.keyToBook[bookKey].author.toLowerCase().includes(searchString.toLowerCase())) {
            this.booksThatMatch[counterIndex] += 1;
            return true;
          }
        }
        else if (radioValue == "genre") {
          var book = this.keyToBook[bookKey];
          for (var i = 0; i < book.genres.length; ++i) {
            if (book.genres[i].toLowerCase().includes(searchString.toLowerCase())) {
              this.booksThatMatch[counterIndex] += 1;
              return true;
            }
          }

          return false;
        }

        return false;
      },

      addFriend: function() {
        let obj = {
          name: this.adminTitle,
          pictureLink: this.adminLink,
        };

        // console.log(obj);

        axios.post( '/api/friends' , obj )
          .then( _response => {
            if ( _response.data.ret === "OK" ) {
              let key = _response.data.data.replace("friends/", "");
              console.log(key); ////

              Vue.set( this.friends, key, obj );
              // Vue.set( this.keyToFriend, key, obj );
              Vue.set( this.booksOf, key, [] );
            }
        } );

      },

      filterFriend: function(friendKey) {

        searchString = document.getElementById("searchString").value;

        if (searchString == null || searchString == "") {
          this.friendsThatMatch[0] += 1;
          return true;
        }

        var radioValue = null;
        var arr = document.getElementsByName("searchType");
        for (var i = 0; i < arr.length; ++i) {
          if (arr[i].checked) {
            radioValue = arr[i].value;
            break;
          }
        }

        // console.log(searchString);
        // console.log(radioValue);
        // console.log(friendKey);

        if (radioValue == "name") {
          if (this.friends[friendKey].name.toLowerCase().includes(searchString.toLowerCase())) {
            this.friendsThatMatch[0] += 1;
            return true;
          }
        }
        else if (radioValue == "book") {
          if (this.booksOf.hasOwnProperty(friendKey) == false) {
            return false;
          }

          for (let i = 0; i < this.booksOf[friendKey].length; ++i) {
            let key = this.booksOf[friendKey][i];
            let book = this.keyToBook[key];
            if (book.bookName.toLowerCase().includes(searchString.toLowerCase())) {
              this.friendsThatMatch[0] += 1;
              return true;
            }
          }
          return false;
        }

        return false;
      },

      setFriend: function(friendKey) {
        // console.log("in");

        if (this.isSet[friendKey] == true) {
          if (this.timeoutOf.hasOwnProperty(friendKey)) {
            clearTimeout(this.timeoutOf[friendKey]);
          }
        }
        else {
          this.timeoutOf[friendKey] = setTimeout( () => {

            this.isSet[friendKey] = true;
            this.forceUpdate();

          }, this.timeoutTimeSet);
        }

      },

      unsetFriend: function(friendKey) {
        // console.log("out");

        if (this.isSet[friendKey] == false) {
          if (this.timeoutOf.hasOwnProperty(friendKey)) {
            clearTimeout(this.timeoutOf[friendKey]);
          }
        }
        else {
          this.timeoutOf[friendKey] = setTimeout( () => {

            this.isSet[friendKey] = false;
            this.forceUpdate();

          }, this.timeoutTimeUnset);
        }

      },

      checkFriend: function(friendKey) {
        // console.log(this.isSet[friendKey]); //
        // console.log(this.booksOf[friendKey]); // 

        return this.isSet.hasOwnProperty(friendKey) && this.isSet[friendKey] == true && this.booksOf.hasOwnProperty(friendKey) && this.booksOf[friendKey].length != 0;
      },


      deleteFriend: function(friendKey) {
        if (confirm("Are you sure you want to unfriend this person?") == false) {
          return;
        }

        this.axios.delete( `/api/friends/${friendKey}` )
          .then( () => {
          // Vue.delete(this.keyToFriend, friendKey);
          Vue.delete(this.friends, friendKey);
          Vue.delete(this.booksOf, friendKey);
        } );
      },

      importFriend: function(friendKey) {
        if (confirm("Are you sure you want to import into this friend?") == false) {
          return;
        }

        let obj = {
          name: this.adminTitle,
          pictureLink: this.adminLink
        };

        Vue.set(this.friends, friendKey, obj);
        axios.put( `/api/friends/${friendKey}` , obj );
      },

      exportFriend: function(friendKey) {
        if (confirm("Are you sure you want to export this friend?") == false) {
          return;
        }

        this.adminTitle = this.friends[friendKey].name;
        this.adminLink = this.friends[friendKey].pictureLink;

        updateImage(this.friends[friendKey].pictureLink);
      },

      unlendFriend: function(friendKey) {
        if (confirm("Are you sure you want to unlend all books from this friend?") == false) {
          return;
        }

        if (this.booksOf.hasOwnProperty[friendKey] == false || this.booksOf[friendKey].length == 0) {
          return;
        }

        let copy = [];
        for (let i = 0; i < this.booksOf[friendKey].length; ++i) {
          copy.push(this.booksOf[friendKey][i]);
        }

        for (let i = 0; i < copy.length; ++i) {
          this.unlendBook(copy[i], true);
        }
      },

      forceUpdate: function() {
        this.booksThatMatch = [0, 0];
        this.friendsThatMatch[0] = 0;
        this.$forceUpdate();
      }
    },

    filters: {
      number: function( _in ) {
        return Number(_in).toFixed(2)
      }
    }
  } );


} );


function updateImage(link) {
  document.getElementById("cover").setAttribute("src", link);
}

function filterBook(bookId) {
  return true;
}
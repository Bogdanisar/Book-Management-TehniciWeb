window.addEventListener( 'load' , function() {
  Vue.prototype.axios = axios;
  let app = new Vue( {
    el: '#app',
    data: {
      bookId: 0,
      friendId: 0,
      hereBooks: {},
      awayBooks: {},
      friends: {},
      idToBook: {},
      idToFriend: {},
      booksOf: {},
      loaded: false,
      booksThatMatch: [0, 0],
      friendsThatMatch: [0]
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

      this.axios.get( '/api/id' )
        .then( (_response) => {
          this.bookId = _response.data.data[0];
          this.friendId = _response.data.data[1];
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
          id = book.bookId;
          this.idToBook[id] = book;

          // console.log(id);
        }

        for (var key in this.awayBooks) {
          if (!this.awayBooks.hasOwnProperty(key)) {
            continue;
          }

          book = this.awayBooks[key];
          id = book.bookId;
          this.idToBook[id] = book;

          // console.log(this.booksOf[book.holderId]);
          if (this.booksOf[book.holderId] == undefined) {
            this.booksOf[book.holderId] = [];
          }
          this.booksOf[book.holderId].push(book);
        }

        for (var key in this.friends) {
          if (!this.friends.hasOwnProperty(key)) {
            continue;
          }

          friend = this.friends[key];
          id = friend.friendId;
          this.idToFriend[id] = friend;
        }

        // console.log(this.idToBook);
        // console.log(this.idToFriend);
        // console.log(this.booksOf);

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

      commit: function() {
        if ( this.editId === null ) {
          // add
          let oo = Object.assign( {} , this.input );
          axios.post( '/api/currency' , oo )
            .then( _response => {
              if ( _response.data.ret === "OK" ) {
                Vue.set( this.currency , _response.data.id , oo );
              }
            } );
        } else {
          // edit
          for ( let k in this.input ) {
            this.currency[this.editId][k] = this.input[k];
          }
          axios.put( `/api/currency/${this.editId}` , this.currency[this.editId] );
          this.editId = null;
          this.input = {
            Date: null,
            EUR: null,
            USD: null
          }
        }
      },

      filterBook: function(bookId, counterIndex) {
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

        console.log(searchString);
        console.log(radioValue);
        console.log(bookId);

        if (radioValue == "title") {
          if (this.idToBook[bookId].bookName.toLowerCase().includes(searchString.toLowerCase())) {
            this.booksThatMatch[counterIndex] += 1;
            return true;
          }
        }
        else if (radioValue == "author") {
          if (this.idToBook[bookId].author.toLowerCase().includes(searchString.toLowerCase())) {
            this.booksThatMatch[counterIndex] += 1;
            return true;
          }
        }
        else if (radioValue == "genre") {
          var book = this.idToBook[bookId];
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

      filterFriend: function(friendId) {
        this.friendsThatMatch[0] += 1;
        return true;
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
myApp.factory('NavigationService', function () {
    var navigation = [{
        name: "Home",
        classis: "active",
        anchor: "home",
        subnav: [{
            name: "Subnav1",
            classis: "active",
            anchor: "home"
        }]
    }, {
        name: "Links",
        classis: "active",
        anchor: "links",
        subnav: []
    }];

    return {
        getNavigation: function () {
            return navigation;
        },
        getCall: function (url, callback) {
            console.log("(((((((((((((((((", url)
            $http.get(url).then(function (data) {
                data = data.data;
                callback(data);
            });
        },

        apiCall: function (movieName, callback) {
            console.log("url$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$", movieName)
            $http.get("https://api.themoviedb.org/3/search/movie?api_key=8e76f97e44d846376fa8e69caac08f5f&query='2012'").then(function (data) {

                data = data.data;
                callback(data);

            });
        }
    };
});
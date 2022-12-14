const Playlist = require('../models/playlist-model')
const User = require('../models/user-model');
/*
    This is our back-end API. It provides all the data services
    our database needs. Note that this file contains the controller
    functions for each endpoint.
    
    @author McKilla Gorilla
*/
createPlaylist = (req, res) => {
    const body = req.body;
    console.log("createPlaylist body: " + JSON.stringify(body));

    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a Playlist',
        })
    }

    const playlist = new Playlist(body);
    console.log("playlist: " + playlist.toString());
    if (!playlist) {
        return res.status(400).json({ success: false, error: err })
    }

    User.findOne({ _id: req.userId }, (err, user) => {
        console.log("user found: " + JSON.stringify(user));
        user.playlists.push(playlist._id);
        user
            .save()
            .then(() => {
                playlist
                    .save()
                    .then(() => {
                        return res.status(201).json({
                            playlist: playlist
                        })
                    })
                    .catch(error => {
                        return res.status(400).json({
                            errorMessage: 'Playlist Not Created!'
                        })
                    })
            });
    })
}

deletePlaylist = async (req, res) => {
    console.log("delete Playlist with id: " + JSON.stringify(req.params.id));
    console.log("delete " + req.params.id);
    Playlist.findById({ _id: req.params.id }, (err, playlist) => {
        console.log("playlist found: " + JSON.stringify(playlist));
        if (err) {
            return res.status(404).json({
                errorMessage: 'Playlist not found!',
            })
        }

        // DOES THIS LIST BELONG TO THIS USER?
        async function asyncFindUser(list) {
            User.findOne({ email: list.ownerEmail }, (err, user) => {
                console.log("user._id: " + user._id);
                console.log("req.userId: " + req.userId);
                if (user._id == req.userId) {
                    console.log("correct user!");
                    Playlist.findOneAndDelete({ _id: req.params.id }, () => {
                        return res.status(200).json({
                            success: true
                        });
                    }).catch(err => console.log(err))
                    user.playlists.splice(user.playlists.indexOf(req.params.id), 1);
                    user.save().catch(error => {
                        return res.status(400).json({
                            errorMessage: 'COULD NOT DELETE PLAYLIST FROM USER'
                        });
                    });
                }
                else {
                    console.log("incorrect user!");
                    return res.status(400).json({ 
                        errorMessage: "authentication error" 
                    });
                }
            });
        }
        asyncFindUser(playlist);
    })
}

getPlaylistById = async (req, res) => {
    console.log("Find Playlist with id: " + JSON.stringify(req.params.id));

    await Playlist.findById({ _id: req.params.id }, (err, list) => {
        if (err) {
            return res.status(400).json({ success: false, error: err });
        }
        console.log("Found list: " + JSON.stringify(list));

        // DOES THIS LIST BELONG TO THIS USER?
        async function asyncFindUser(list) {
            await User.findOne({ email: list.ownerEmail }, (err, user) => {
                console.log("user._id: " + user._id);
                console.log("req.userId: " + req.userId);
                if (user._id == req.userId) {
                    console.log("correct user!");
                    return res.status(200).json({ success: true, playlist: list })
                }
                else {
                    console.log("incorrect user!");
                    return res.status(400).json({ success: false, description: "authentication error" });
                }
            });
        }
        asyncFindUser(list);
    }).catch(err => console.log(err))
}
getPlaylistPairs = async (req, res) => {
    console.log("getPlaylistPairs");
    await User.findOne({ _id: req.userId }, (err, user) => {
        console.log("find user with id " + req.userId);
        async function asyncFindList(email) {
            console.log("find all Playlists owned by " + email);
            await Playlist.find({ ownerEmail: email }, (err, playlists) => {
                console.log("found Playlists: " + JSON.stringify(playlists));
                if (err) {
                    return res.status(400).json({ success: false, error: err })
                }
                if (!playlists) {
                    console.log("!playlists.length");
                    return res
                        .status(404)
                        .json({ success: false, error: 'Playlists not found' })
                }
                else {
                    console.log("Send the Playlist pairs");
                    // PUT ALL THE LISTS INTO ID, NAME PAIRS
                    // let pairs = [];
                    // for (let key in playlists) {
                    //     let list = playlists[key];
                    //     let pair = {
                    //         _id: list._id,
                    //         name: list.name
                    //     };
                    //     pairs.push(pair);
                    // }
                    return res.status(200).json({ success: true, idNamePairs: playlists })
                }
            }).catch(err => console.log(err))
        }
        asyncFindList(user.email);
    }).catch(err => console.log(err))
}
getPlaylists = async (req, res) => {
    await Playlist.find({}, (err, playlists) => {
        if (err) {
            return res.status(400).json({ success: false, error: err })
        }
        if (!playlists.length) {
            return res
                .status(404)
                .json({ success: false, error: `Playlists not found` })
        }
        return res.status(200).json({ success: true, data: playlists })
    }).catch(err => console.log(err))
}
getPPPairs = async (req, res) => {
    async function findPPPairs(){
        await Playlist.find({ isPublished: true }, (err, playlists) => {
            if(err) {
                console.log("CAN'T FIND PUBLISHED PAIRS");
                return res.status(400).json({success: false, error: err});
            }
            if(!playlists) {
                console.log("NO PUBLISHED PAIRS FOUND");
                return res.status(404).json({success: false, error: "Playlists not found"})
            }
            else {
                console.log('GET PUBLISHED PLAYLISTS');
                return res.status(200).json({ success: true, idNamePairs: playlists });
            }
        }).catch(err => console.log(err))
    }
    findPPPairs();
}


getPPPairsByListname = async(req, res) => {
    async function findPPPairsByListname(name){
            await Playlist.find({ isPublished: true }, (err, playlists) => {
                if(err) {
                    console.log("CAN'T FIND PUBLISHED PAIRS");
                    return res.status(400).json({success: false, error: err});
                }
                if(!playlists) {
                    console.log("NO PUBLISHED PAIRS FOUND");
                    return res.status(404).json({success: false, error: "Playlists not found"})
                }
                else {
                    console.log('DO THE FILTER THING');
                    let matched = playlists.filter((match) => (match.name.includes(name)))
                    console.log(matched);
                    return res.status(200).json({ success: true, idNamePairs: matched })
                }
        }).catch(err => console.log(err))
    }
    findPPPairsByListname(req.params.name);
}
getPPPairsByUsername = async(req, res) => {
    async function findPPPairsByUsername(userName){
        await Playlist.find({ isPublished: true }, (err, playlists) => {
            if(err) {
                console.log("CAN'T FIND PUBLISHED PAIRS");
                return res.status(400).json({success: false, error: err});
            }
            if(!playlists) {
                console.log("NO PUBLISHED PAIRS FOUND")
                return res.status(404).json({success: false, error: "Playlists not found"})
            }
            if(!userName) {
                console.log("NO USERNAME PROVIDED")
                return res.status(404).json({success: false, error: "Username not provided"})
            }
            else {
                console.log('USERNAME GET?');
                let matched = playlists.filter((match) => (match.ownerUserName.includes(userName)))
                return res.status(200).json({ success: true, idNamePairs: matched })
            }
        }).catch(err => console.log(err))
    }
    findPPPairsByUsername(req.params.userName);
}


updatePlaylist = async (req, res) => {
    const body = req.body
    console.log("updatePlaylist: " + JSON.stringify(body));
    console.log("req.body.name: " + req.body.name);
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body to update',
        })
    }
    Playlist.findOne({ _id: req.params.id }, (err, playlist) => {
        console.log("playlist found: " + JSON.stringify(playlist));
        if (err) {
            return res.status(404).json({
                err,
                message: 'Playlist not found!',
            })
        }

        // DOES THIS LIST BELONG TO THIS USER?
        async function asyncFindUser(list) {
            await User.findOne({ email: list.ownerEmail }, (err, user) => {
                console.log("user._id: " + user._id);
                console.log("req.userId: " + req.userId);
                if (user._id == req.userId) {
                    console.log("correct user!");
                    console.log("req.body.name: " + req.body.name);

                    list.name = body.playlist.name;
                    list.songs = body.playlist.songs;
                    list.isPublished = body.playlist.isPublished;
                    list.publishedDate = body.playlist.publishedDate;
                    list.likes = body.playlist.likes;
                    list.dislikes = body.playlist.dislikes;
                    list.listens = body.playlist.listens;
                    list.comments = body.playlist.comments;
                    list
                        .save()
                        .then(() => {
                            console.log("SUCCESS!!!");
                            return res.status(200).json({
                                success: true,
                                id: list._id,
                                message: 'Playlist updated!',
                            })
                        })
                        .catch(error => {
                            console.log("FAILURE: " + JSON.stringify(error));
                            return res.status(404).json({
                                error,
                                message: 'Playlist not updated!',
                            })
                        })
                }
                else {
                    console.log("incorrect user!");
                    return res.status(400).json({ success: false, description: "authentication error" });
                }
            });
        }
        asyncFindUser(playlist);
    })
}

addCommentToList = async (req, res) => {
    const body = req.body
    console.log("updatePlaylist: " + JSON.stringify(body));
    console.log("req.body.name: " + req.body.name);

    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body to update',
        })
    }

    Playlist.findOne({ _id: req.params.id }, (err, playlist) => {
        console.log("playlist found: " + JSON.stringify(playlist));
        if (err) {
            return res.status(404).json({
                err,
                message: 'Playlist not found!',
            })
        }
        console.log(req.body.comment);
        playlist.comments.push(req.body.comment);

        playlist.save()
        .then(() => {
            console.log("SUCCESS");
            return res.status(200).json({
                success: true,
                id: playlist._id,
                message: 'Playlist updated!',
            })
        })
        .catch(error => {
            console.log("FAILURE" + JSON.stringify(error));
            return res.status(404).json({
                error,
                message: 'Playlist not updated!',
            })
        })      
    })
}

module.exports = {
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getPlaylistPairs,
    getPlaylists,
    getPPPairs,
    getPPPairsByListname,
    getPPPairsByUsername,
    updatePlaylist,
    addCommentToList
}
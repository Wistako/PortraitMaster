const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file && file.type.startsWith('image')) { // if fields are not empty...
      if(title.length < 1 || title.length > 25) throw new Error('Wrong input!');
      if(author.length < 1 || author.length > 50) throw new Error('Wrong input!');
      const htmlPattern = new RegExp(/<[^>]*>/);
      if(htmlPattern.test(title) || htmlPattern.test(author)) throw new Error('Wrong input!');
      const emailPattern = new RegExp(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/);
      if(!emailPattern.test(email)) throw new Error('Wrong input!');

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const ip = req.clientIp;
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const voter = await Voter.findOne({ user: ip });
      if(!voter) {
        const newVoter = new Voter({ user: ip });
        newVoter.votes.push(photoToUpdate._id);
        await newVoter.save();
      } else {
        const isVoted = voter.votes.some(vote => {
          return vote.toString() === photoToUpdate._id.toString();
        });
        if(isVoted) {
          res.status(500).json({ message: 'You can only vote once for each photo' });
          return;
        } else {
          voter.votes.push(photoToUpdate._id);
          await voter.save();
        }
      }
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch(err) {
    res.status(500).json(err);
  }

};

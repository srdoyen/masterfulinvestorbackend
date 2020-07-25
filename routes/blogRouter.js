const express = require("express");
const bodyParser = require("body-parser");
const Blog = require("../models/blog");
const authenticate = require("../authenticate");
const blogRouter = express.Router();

const User = require("../models/user");

blogRouter.use(bodyParser.json());

blogRouter
  .route("/")
  .get((req, res, next) => {
    Blog.find()
      .populate("comments.author")
      .then((blogs) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(blogs);
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Blog.create(req.body)
      .then((blog) => {
        console.log("Blog Created ", blog);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(blog);
      })
      .catch((err) => next(err));
  })
  .put(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /blogs");
  })
  .delete(
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Blog.deleteMany()
        .then((response) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(response);
        })
        .catch((err) => next(err));
    }
  );

blogRouter
  .route("/:blogId")
  .get((req, res, next) => {
    Blog.findById(req.params.blogId)
      .populate("comments.author")
      .then((blog) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(blog);
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /blogs/${req.params.blogId}`);
  })
  .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Blog.findByIdAndUpdate(
      req.params.blogId,
      {
        $set: req.body,
      },
      { new: true }
    )
      .then((blog) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(blog);
      })
      .catch((err) => next(err));
  })
  .delete(
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Blog.findByIdAndDelete(req.params.blogId)
        .then((response) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(response);
        })
        .catch((err) => next(err));
    }
  );

blogRouter
  .route("/:blogId/comments")
  .get((req, res, next) => {
    Blog.findById(req.params.blogId)
      .populate("comments.author")
      .then((blog) => {
        if (blog) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(blog.comments);
        } else {
          err = new Error(`Blog ${req.params.blogId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    Blog.findById(req.params.blogId)
      .then((blog) => {
        if (blog) {
          req.body.author = req.user._id;
          blog.comments.push(req.body);
          blog
            .save()
            .then((blog) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(blog);
            })
            .catch((err) => next(err));
        } else {
          err = new Error(`Blog ${req.params.blogId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .put(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /blogs/${req.params.blogId}/comments`
    );
  })
  .delete(
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Blog.findById(req.params.blogId)
        .then((blog) => {
          if (blog) {
            for (let i = blog.comments.length - 1; i >= 0; i--) {
              blog.comments.id(blog.comments[i]._id).remove();
            }
            blog
              .save()
              .then((blog) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(blog);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(`Blog ${req.params.blogId} not found`);
            err.status = 404;
            return next(err);
          }
        })
        .catch((err) => next(err));
    }
  );

blogRouter
  .route("/:blogId/comments/:commentId")
  .get((req, res, next) => {
    Blog.findById(req.params.blogId)
      .populate("comments.author")
      .then((blog) => {
        if (blog && blog.comments.id(req.params.commentId)) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(blog.comments.id(req.params.commentId));
        } else if (!blog) {
          err = new Error(`Blog ${req.params.blogId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `POST operation not supported on /blogs/${req.params.blogId}/comments/${req.params.commentId}`
    );
  })
  .put(authenticate.verifyUser, (req, res, next) => {
    Blog.findById(req.params.blogId)
      .then((blog) => {
        const thisComment = blog.comments.id(req.params.commentId);
        if (blog && thisComment) {
          if (thisComment.author._id.equals(req.user._id)) {
            if (req.body.rating) {
              thisComment.rating = req.body.rating;
            }
            if (req.body.text) {
              thisComment.text = req.body.text;
            }
            blog
              .save()
              .then((blog) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(blog);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(`Not the correct author of this comment`);
            err.status = 403;
            return next(err);
          }
        } else if (!blog) {
          err = new Error(`Blog ${req.params.blogId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    Blog.findById(req.params.blogId)
      .then((blog) => {
        const thisComment = blog.comments.id(req.params.commentId);
        if (blog && thisComment) {
          if (thisComment.author._id.equals(req.user._id)) {
            thisComment.remove();
            blog
              .save()
              .then((blog) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(blog);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(`Not the correct author of this comment`);
            err.status = 403;
            return next(err);
          }
        } else if (!blog) {
          err = new Error(`Blog ${req.params.blogId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })

      .catch((err) => next(err));
  });

module.exports = blogRouter;

const express = require("express");
const bodyParser = require("body-parser");
const Blog = require("../models/blog");
const authenticate = require("../authenticate");
const blogRouter = express.Router();
const cors = require("./cors");
const User = require("../models/user");

blogRouter.use(bodyParser.json());

blogRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Blog.find()
      .then((blogs) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(blogs);
      })
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Blog.create(req.body)
        .then((blog) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(blog);
        })
        .catch((err) => next(err));
    }
  )
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /blogs");
  })
  .delete(
    cors.corsWithOptions,
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
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Blog.findById(req.params.blogId)
      .populate("comments.author")
      .then((blog) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(blog);
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /blogs/${req.params.blogId}`);
  })
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
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
    }
  )
  .delete(
    cors.corsWithOptions,
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
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
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
  .post(cors.corsWithOptions, (req, res, next) => {
    Blog.findById(req.body.blogId)
      .then((blog) => {
        if (blog) {
          blog.comments.push({
            name: req.body.name,
            email: req.body.email,
            comment: req.body.comment,
          });
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
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /blogs/${req.params.blogId}/comments`
    );
  })
  .delete(
    cors.corsWithOptions,
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
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
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
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `POST operation not supported on /blogs/${req.params.blogId}/comments/${req.params.commentId}`
    );
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
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
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
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

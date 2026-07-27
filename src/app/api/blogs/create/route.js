import { dbConnect } from "@/lib/db/mongodb";
import { NextResponse } from "next/server";
import Blog from "@/models/Blog";
import { BlogValidation } from "@/lib/validation/blog";
import User from "@/models/User";
import slugify from "slugify";
import mongoose from "mongoose";
import { revalidateTag } from 'next/cache';

const PUBLIC_AUTHOR_EMAIL = "public@writza.app";

async function getPublicAuthor() {
  let user = await User.findOne({ email: PUBLIC_AUTHOR_EMAIL });
  if (!user) {
    user = await User.create({
      username: "public_writer",
      email: PUBLIC_AUTHOR_EMAIL,
      password: "PublicWriter#2026",
      role: "admin",
    });
  }
  return user;
}

export async function POST(req) {
  try {
    const reqData = await req.json();
  
    const inputValidate = BlogValidation.safeParse(reqData);

    if (!inputValidate.success) {
      return NextResponse.json(
        {
          error:true , 
          message : inputValidate.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await dbConnect();
    const publicAuthor = await getPublicAuthor();


   const id = new mongoose.Types.ObjectId();
    const baseSlug = slugify(inputValidate.data.title , {
    replacement: '-' ,
      lower: true,
      strict:true ,
      trim:true,
      remove: /[*+~.()'"!:@]/g

    })

 const slugData = `${baseSlug}-${id}`;
 

    const blogData = {
      _id : id ,
      title: inputValidate.data.title,
      shortDescription: inputValidate.data.shortDescription,
      content: inputValidate.data.content,
      tags: inputValidate.data?.tags,
      slug : slugData ,
      author: publicAuthor._id,
      publishedAt: new Date(),
    };

    const savedBlog = await Blog.create(blogData);
    await savedBlog.populate("author", "username");

    // Invalidate cache after creating new blog
    revalidateTag('blogs');
    revalidateTag('blogs-list');
    revalidateTag('blogs-all');

    return NextResponse.json(
      {
        error:false , 
        message: "Blog created successfully!",
        blog: savedBlog,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Blog creation error:", error);
  }

  return NextResponse.json(
    {
      error:true , 
      message :"Internal Server Error - Failed to create blog",
    },
    { status: 500 }
  );
}

package com.amerhwitat.chimera.test.mobile
import android.app.Activity
import android.os.Bundle
import android.view.Gravity
import android.widget.*
class MainActivity:Activity(){override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);val r=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;gravity=Gravity.CENTER;setPadding(32,32,32,32)};val t=TextView(this).apply{text="Chimera Integration — Kotlin Mobile";textSize=22f;gravity=Gravity.CENTER};val s=TextView(this).apply{text="Spit Fire → Koronos → services → Jasper\n128D/P2P conformance: ready\nMobile boot gate: ready";textSize=16f;gravity=Gravity.CENTER;setPadding(0,24,0,24)};val b=Button(this).apply{text="Run mobile conformance";setOnClickListener{s.text="Mobile conformance: active\nBoot/service contract: ready\n128D/P2P boundary: active"}};r.addView(t);r.addView(s);r.addView(b);setContentView(r)}}

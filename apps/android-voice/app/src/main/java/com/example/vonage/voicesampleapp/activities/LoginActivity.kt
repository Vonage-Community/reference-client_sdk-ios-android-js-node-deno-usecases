package com.example.vonage.voicesampleapp.activities

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.widget.Toast
import com.example.vonage.voicesampleapp.App
import com.example.vonage.voicesampleapp.BuildConfig
import com.example.vonage.voicesampleapp.databinding.ActivityLoginBinding
import com.example.vonage.voicesampleapp.utils.navigateToMainActivity
import com.example.vonage.voicesampleapp.utils.showToast
import com.example.vonage.voicesampleapp.R


class LoginActivity : AppCompatActivity() {
    private val coreContext = App.coreContext
    private val clientManager = coreContext.clientManager
    private var loginWithToken = true
    private val defaultToken = BuildConfig.VONAGE_API_TOKEN
    private lateinit var binding: ActivityLoginBinding
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        binding.apply {
            checkboxLoginWithToken.setOnCheckedChangeListener { _, isChecked ->
                loginWithToken = isChecked
                editText.setText(if(loginWithToken) defaultToken else null)
                editTextLayout.hint = if(loginWithToken) getString(R.string.token_hint) else getString(R.string.login_code_hint)
            }
            editText.setText(defaultToken)
            btnLogin.setOnClickListener {
                login()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        clientManager.sessionId?.let {
            navigateToMainActivity()
        }
    }

    private fun login(){
        val tokenOrCode = binding.editText.text.toString()
        val progressBar = binding.progressBar.apply {
            visibility = View.VISIBLE
        }
        val onErrorCallback = { error: Exception ->
            progressBar.visibility = View.INVISIBLE
            showToast(this, "Login Failed: ${error.message}")
        }
        val onSuccessCallback = { sessionId: String ->
            progressBar.visibility = View.INVISIBLE
            showToast(this, "Logged in with session ID: $sessionId", Toast.LENGTH_SHORT)
            navigateToMainActivity()
        }
        if(loginWithToken) {
            clientManager.login(token = tokenOrCode, onErrorCallback, onSuccessCallback)
        }
        else {
            clientManager.loginWithCode(code = tokenOrCode, onErrorCallback, onSuccessCallback)
        }
    }
}
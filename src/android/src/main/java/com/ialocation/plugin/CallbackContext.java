package com.ialocation.plugin;

import com.remobile.cordova.CordovaPlugin;
import com.remobile.cordova.JsonConvert;
import com.remobile.cordova.PluginResult;

import org.json.JSONException;
import org.json.JSONObject;

// react.native
class CallbackContext {
    private final String mCallbackName;
    private final com.remobile.cordova.CallbackContext mRealCallbackContext;
    private final CordovaPlugin mPlugin;

    CallbackContext(String callbackName, com.remobile.cordova.CallbackContext realCallbackContext, CordovaPlugin plugin) {
        mCallbackName = callbackName;
        mRealCallbackContext = realCallbackContext;
        mPlugin = plugin;
    }

    void sendPluginResult(PluginResult pluginResult) {
        if (pluginResult.messageType != PluginResult.MESSAGE_TYPE_JSON_OBJECT) {
            throw new IllegalArgumentException("Unsupported message type "+pluginResult.messageType);
        }
        if (pluginResult.status == PluginResult.Status.OK.ordinal()) {
            // send OK results as events to workaround react.native callbacks only being callable once
            try {
                mPlugin.sendJSEvent(mCallbackName, JsonConvert.jsonToReact(pluginResult.jsonObjectMessage));
            } catch (JSONException ex) {
                error("Internal error converting results:" + ex.getMessage());
            }
        } else {
            // send ERROR results via normal callback (assuming only one error per callback)
            mRealCallbackContext.sendPluginResult(pluginResult);
        }
    }

    // assume these only get called once so use normal callbacks
    void success() {
        mRealCallbackContext.success();
    }

    void success(JSONObject message) {
        mRealCallbackContext.success(message);
    }

    void success(String message) {
        mRealCallbackContext.success(message);
    }

    void error(JSONObject message) {
        mRealCallbackContext.error(message);
    }

    void error(String message) {
        mRealCallbackContext.error(message);
    }
}
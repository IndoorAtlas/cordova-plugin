package com.ialocation.plugin;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

public class CurrentStatus {
    private static final String TAG ="CurrentStatus";

    public static final int STATUS_OUT_OF_SERVICE = 0;
    public static final int STATUS_TEMPORARILY_UNAVAILABLE = 1;
    public static final int STATUS_AVAILABLE = 2;
    public static final int STATUS_LIMITED = 10;

    /**
     * Returns a JSON object with given code
     * @param code
     * @return
     */
    public static JSONObject getStatusObject(int statusCode) {
        try {
            JSONObject statusObject = new JSONObject();
            statusObject.put("code", statusCode);
            
            switch(statusCode) {
                case STATUS_AVAILABLE:
                    statusObject.put("message", "Available");
                    break;
                case STATUS_LIMITED:
                    statusObject.put("message", "Service Limited");
                    break;
                case STATUS_TEMPORARILY_UNAVAILABLE:
                    statusObject.put("message", "Service Unavailable");
                    break;
                case STATUS_OUT_OF_SERVICE:
                    statusObject.put("message", "Out of Service");
                    break;
                default:
                    statusObject.put("message", "Unspecified Status");
                    break;
            }
            return statusObject;
        }
        catch(Exception ex) {
            Log.e(TAG,ex.toString());
            throw new IllegalStateException(ex.getMessage());
        }
    }
}

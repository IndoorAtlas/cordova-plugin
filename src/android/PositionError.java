package com.ialocation.plugin;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * A helper class which returns error info in a JSON object.
 */
public class PositionError {
    private static final String TAG ="PositionError";

    public static final int PERMISSION_DENIED = 1;
    public static final int POSITION_UNAVAILABLE = 2;
    public static final int TIMEOUT = 3;
    public static final int INVALID_ACCESS_TOKEN = 4;
    public static final int INITIALIZATION_ERROR = 5;
    public static final int FLOOR_PLAN_UNAVAILABLE = 6;
    public static final int UNSPECIFIED_ERROR = 7;
    public static final int FLOOR_PLAN_UNDEFINED = 8;
    public static final int INVALID_VALUE = 9;

    /**
     * Returns an error JSON object with given errorCode and message
     * @param errorCode
     * @param message
     * @return
     */
    public static JSONObject getErrorObject(int errorCode, String message){
        try{
            JSONObject errorObject = new JSONObject();
            errorObject.put("code",errorCode);
            errorObject.put("message",message);
            return errorObject;
        }
        catch(Exception ex){
            Log.e(TAG,ex.toString());
            throw new IllegalStateException(ex.getMessage());
        }
    }

    /**
     * Returns an error JSON object with given errorCode
     * @param errorCode
     * @return
     */
    public static JSONObject getErrorObject(int errorCode){
        try{
            JSONObject errorObject = new JSONObject();
            switch(errorCode){
                case PERMISSION_DENIED:
                    errorObject.put("code",errorCode);
                    errorObject.put("message","Permission denied");
                    break;
                case POSITION_UNAVAILABLE:
                    errorObject.put("code",errorCode);
                    errorObject.put("message","Position not available");
                    break;
                case TIMEOUT:
                    errorObject.put("code",errorCode);
                    errorObject.put("message","Request timed out");
                    break;
                case INVALID_ACCESS_TOKEN:
                    errorObject.put("code",errorCode);
                    errorObject.put("message","Invalid access token");
                    break;
                case INITIALIZATION_ERROR:
                    errorObject.put("code",errorCode);
                    errorObject.put("message","IndoorAtlas is not initialized");
                    break;
                case FLOOR_PLAN_UNAVAILABLE:
                    errorObject.put("code",errorCode);
                    errorObject.put("message","Floor plan unavailable");
                    break;
                case FLOOR_PLAN_UNDEFINED:
                    errorObject.put("code",errorCode);
                    errorObject.put("message","Floor plan undefined. See ~/www/jsAPIKeys.js file");
                    break;
                case INVALID_VALUE:
                    errorObject.put("code",errorCode);
                    errorObject.put("message","Distance value should be positive");
                case UNSPECIFIED_ERROR:
                    errorObject.put("code",errorCode);
                    errorObject.put("message","Unspecified error");
                    break;
                default:
                    errorObject.put("code",errorCode);
                    errorObject.put("message","Unspecified error");
                    break;
            }
            return errorObject;
        }
        catch(Exception ex){
            Log.e(TAG,ex.toString());
            throw new IllegalStateException(ex.getMessage());
        }
    }
}

package com.ialocation.plugin;

import android.os.Bundle;
import android.util.Log;

import com.indooratlas.android.sdk.IALocation;
import com.indooratlas.android.sdk.IALocationListener;
import com.indooratlas.android.sdk.IALocationManager;
import com.indooratlas.android.sdk.IARegion;
import com.indooratlas.android.sdk.IAOrientationListener;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.HashMap;

/**
 * Handles events from IALocationListener and IARegion.Listener and relays them to Javascript callbacks.
 */
public class IndoorLocationListener implements IALocationListener, IARegion.Listener, IAOrientationListener {
    private static final String TAG = "IndoorLocationListener";

    private static final int TRANSITION_TYPE_UNKNOWN = 0;
    private static final int TRANSITION_TYPE_ENTER = 1;
    private static final int TRANSITION_TYPE_EXIT = 2;

    private HashMap<String, CallbackContext> watches = new HashMap<String, CallbackContext>();
    private HashMap<String, CallbackContext> regionWatches = new HashMap<String, CallbackContext>();
    private CallbackContext attitudeUpdateCallbackContext;
    private CallbackContext headingUpdateCallbackContext;
    private CallbackContext statusUpdateCallbackContext;
    private ArrayList<CallbackContext> mCallbacks = new ArrayList<CallbackContext>();
    private CallbackContext mCallbackContext;
    public IALocation lastKnownLocation = null;
    private IALocationPlugin owner;

    /**
     * The constructor
     * @param iaLocationPlugin
     */
    public IndoorLocationListener(IALocationPlugin iaLocationPlugin) {
        this.owner = iaLocationPlugin;
    }

    /**
     * Returns watchPosition callback collection.
     * @return
     */
    public HashMap<String, CallbackContext> getWatches() {
        return watches;
    }

    /**
     * Returns getCurrentPosition callback collection
     * @return
     */
    public ArrayList<CallbackContext> getCallbacks() {
        return mCallbacks;
    }

    /**
     * Returns a JSON object the last known user position
     * @return
     */
    public JSONObject getLastKnownLocation() {
        if (lastKnownLocation != null) {
            JSONObject locationData = getLocationJSONFromIALocation(lastKnownLocation);
            return locationData;
        }
        return null;
    }

    /**
     * Adds watchPosition JS callback to the collection
     * @param watchId
     * @param callbackContext
     */
    public void addWatch(String watchId, CallbackContext callbackContext) {
        watches.put(watchId, callbackContext);
    }

    /**
     * Adds watchRegion JS callback to the collection
     * @param watchId
     * @param callbackContext
     */
    public void addRegionWatch(String watchId, CallbackContext callbackContext) {
        regionWatches.put(watchId, callbackContext);
    }

    /**
     * Adds attitudeWatch JS callback to the collection
     * @param callbackContext
     */
    public void addAttitudeCallback(CallbackContext callbackContext) {
      attitudeUpdateCallbackContext = callbackContext;
    }

    /**
     * Adds headingWatch JS callback to the collection
     * @param callbackContext
     */
    public void addHeadingCallback(CallbackContext callbackContext) {
      headingUpdateCallbackContext = callbackContext;
    }

    /**
     * Adds getCurrentPosition JS callback to the collection
     * @param callbackContext
     */
    public void addCallback(CallbackContext callbackContext) {
        mCallbacks.add(callbackContext);
    }

    /**
     * Adds headingWatch JS callback to the collection
     * @param callbackContext
     */
    public void addStatusChangedCallback(CallbackContext callbackContext) {
      statusUpdateCallbackContext = callbackContext;
    }

    /**
     * Returns the sum of the all callback collections
     * @return
     */
    public int size() {
        return watches.size() + mCallbacks.size() + regionWatches.size();
    }

    /**
     * Removes a callback from watchPosition callback collection
     * @param watchId
     */
    public void clearWatch(String watchId) {
        if (watches.containsKey(watchId)) {
            watches.remove(watchId);
        }
        if (size() == 0) {
            owner.stopPositioning();
        }
    }

    /**
     * Removes a callback from watchRegion callback collection
     * @param watchId
     */
    public void clearRegionWatch(String watchId) {
        if (regionWatches.containsKey(watchId)) {
            regionWatches.remove(watchId);
        }
        if (size() == 0){
            owner.stopPositioning();
        }
    }

    /**
     * Removes attitude callback
     */
    public void removeAttitudeCallback() {
      attitudeUpdateCallbackContext = null;
    }

    /**
     * Removes heading callback
     */
     public void removeHeadingCallback() {
       headingUpdateCallbackContext = null;
     }

     /**
      * Removes status callback
      */
      public void removeStatusCallback() {
        statusUpdateCallbackContext = null;
      }

    /**
     * Returns a JSON object which contains IARegion info.
     * @param iaRegion
     * @param transitionType
     * @return
     */
    private JSONObject getRegionJSONFromIARegion(IARegion iaRegion, int transitionType) {
        try {
            JSONObject regionData = new JSONObject();
            regionData.put("regionId", iaRegion.getId());
            regionData.put("timestamp", iaRegion.getTimestamp());
            regionData.put("regionType", iaRegion.getType());
            regionData.put("transitionType", transitionType);
            return regionData;
        }
        catch(JSONException ex) {
            Log.e(TAG, ex.toString());
            throw new IllegalStateException(ex.getMessage());
        }
    }

    /**
     * Returns a JSON object which contains IALocation info.
     * @param iaLocation
     * @return
     */
    private JSONObject getLocationJSONFromIALocation(IALocation iaLocation) {
        try {
            JSONObject locationData,regionData;
            locationData = new JSONObject();
            locationData.put("accuracy", iaLocation.getAccuracy());
            locationData.put("altitude", iaLocation.getAltitude());
            locationData.put("heading", iaLocation.getBearing());
            locationData.put("floorCertainty", iaLocation.getFloorCertainty());
            locationData.put("flr", iaLocation.getFloorLevel());
            locationData.put("latitude", iaLocation.getLatitude());
            locationData.put("longitude", iaLocation.getLongitude());
            if (iaLocation.getRegion() != null) {
                regionData = getRegionJSONFromIARegion(iaLocation.getRegion(), TRANSITION_TYPE_UNKNOWN);
                locationData.put("region", regionData);
            }
            locationData.put("velocity",iaLocation.toLocation().getSpeed());
            locationData.put("timestamp",iaLocation.getTime());
            return locationData;
        }
        catch(JSONException ex) {
            Log.e(TAG, ex.toString());
            throw new IllegalStateException(ex.getMessage());
        }
    }

    /**
     * Called when the location has changed.
     * @param iaLocation
     */
    @Override
    public void onLocationChanged(IALocation iaLocation) {
        JSONObject locationData;
        Log.w(TAG, "Got location");
        locationData = getLocationJSONFromIALocation(iaLocation);
        lastKnownLocation = iaLocation;
        sendResult(locationData);
    }

    /**
     * Called to report that user has entered a new region.
     * @param iaRegion
     */
    @Override
    public void onEnterRegion(IARegion iaRegion) {
        JSONObject regionData = getRegionJSONFromIARegion(iaRegion, TRANSITION_TYPE_ENTER);
        sendRegionResult(regionData);
    }

    /**
     * Called to report that user has exited a region.
     * @param iaRegion
     */
    @Override
    public void onExitRegion(IARegion iaRegion) {
        JSONObject regionData = getRegionJSONFromIARegion(iaRegion, TRANSITION_TYPE_EXIT);
        sendRegionResult(regionData);
    }

    /**
     * Called to report that orientation has changed
     * @param timestamp
     * @param quaternion
     */
    @Override
    public void onOrientationChange(long timestamp, double[] quaternion) {
      try {
          JSONObject orientationData;
          orientationData = new JSONObject();
          orientationData.put("timestamp", timestamp);
          orientationData.put("x", quaternion[1]);
          orientationData.put("y", quaternion[2]);
          orientationData.put("z", quaternion[3]);
          orientationData.put("w", quaternion[0]);

          sendOrientationResult(orientationData);
      }
      catch(JSONException ex) {
          Log.e(TAG, ex.toString());
          throw new IllegalStateException(ex.getMessage());
      }
    }

    /**
     * Called to report that orientation has changed
     * @param timestamp
     * @param quaternion
     */
    @Override
    public void onHeadingChanged(long timestamp, double heading) {
      try {
          JSONObject headingData;
          headingData = new JSONObject();
          headingData.put("timestamp", timestamp);
          headingData.put("trueHeading", heading);
          sendHeadingResult(headingData);
      }
      catch(JSONException ex) {
          Log.e(TAG, ex.toString());
          throw new IllegalStateException(ex.getMessage());
      }
    }

    /**
     * Invokes JS callback from watchRegion callback collection.
     * @param orientationData
     */
     private void sendOrientationResult(JSONObject orientationData) {
       if (attitudeUpdateCallbackContext != null) {
         PluginResult pluginResult;
         pluginResult = new PluginResult(PluginResult.Status.OK, orientationData);
         pluginResult.setKeepCallback(true);
         attitudeUpdateCallbackContext.sendPluginResult(pluginResult);
       }
     }

    /**
     * Invokes JS callback from watchRegion callback collection.
     * @param headingData
     */
    private void sendHeadingResult(JSONObject headingData) {
      if (headingUpdateCallbackContext != null) {
        PluginResult pluginResult;
        pluginResult = new PluginResult(PluginResult.Status.OK, headingData);
        pluginResult.setKeepCallback(true);
        headingUpdateCallbackContext.sendPluginResult(pluginResult);
      }
    }


    /**
     * Invokes JS callback from watchRegion callback collection.
     * @param regionData
     */
    private void sendRegionResult(JSONObject regionData) {
        PluginResult pluginResult;
        for (CallbackContext callbackContext : regionWatches.values()) {
            pluginResult = new PluginResult(PluginResult.Status.OK, regionData);
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);
        }
    }

    /**
     * Invokes JS callback from watchPosition callback collection.
     * @param locationData
     */
    private void sendResult(JSONObject locationData) {
        PluginResult pluginResult;
        for (CallbackContext callbackContext : mCallbacks) {
            pluginResult = new PluginResult(PluginResult.Status.OK, locationData);
            pluginResult.setKeepCallback(false);
            callbackContext.sendPluginResult(pluginResult);
        }

        for (CallbackContext callbackContext : watches.values()) {
            pluginResult = new PluginResult(PluginResult.Status.OK, locationData);
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);
        }
        mCallbacks.clear();
        if (size() == 0) {
            owner.stopPositioning();
        }
    }

    /**
     * Invokes JS callback from statusChanged callback.
     * @param statusData
     */
    private void sendStatusResult(JSONObject statusData) {
      if (statusUpdateCallbackContext != null) {
        PluginResult pluginResult;
        pluginResult = new PluginResult(PluginResult.Status.OK, statusData);
        pluginResult.setKeepCallback(true);
        statusUpdateCallbackContext.sendPluginResult(pluginResult);
      }
    }

    /**
     * Notifies JS callbacks about service interuption
     */
    private void handleServiceInteruption() {
        PluginResult pluginResult;
        for (CallbackContext callbackContext : watches.values()) {
            pluginResult = new PluginResult(PluginResult.Status.ERROR, PositionError.getErrorObject(PositionError.POSITION_UNAVAILABLE));
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);
        }
        for (CallbackContext callbackContext : regionWatches.values()) {
            pluginResult = new PluginResult(PluginResult.Status.ERROR, PositionError.getErrorObject(PositionError.POSITION_UNAVAILABLE));
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);
        }
    }

    /**
     * Called when provider status changes.
     * @param provider
     * @param status
     * @param bundle
     */
    @Override
    public void onStatusChanged(String provider, int status, Bundle bundle) {
        JSONObject statusData;
        statusData = new JSONObject();
        switch (status) {
          case IALocationManager.STATUS_AVAILABLE:
              statusData = CurrentStatus.getStatusObject(CurrentStatus.STATUS_AVAILABLE);
              sendStatusResult(statusData);
              break;
          case IALocationManager.STATUS_LIMITED:
              statusData = CurrentStatus.getStatusObject(CurrentStatus.STATUS_LIMITED);
              sendStatusResult(statusData);
              break;
          case IALocationManager.STATUS_OUT_OF_SERVICE:
              statusData = CurrentStatus.getStatusObject(CurrentStatus.STATUS_OUT_OF_SERVICE);
              sendStatusResult(statusData);
              break;
          case IALocationManager.STATUS_TEMPORARILY_UNAVAILABLE:
              statusData = CurrentStatus.getStatusObject(CurrentStatus.STATUS_TEMPORARILY_UNAVAILABLE);
              sendStatusResult(statusData);
              break;
        }
    }
  }

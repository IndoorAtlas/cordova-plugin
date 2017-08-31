package com.ialocation.plugin;

import android.os.Bundle;
import android.util.Log;

import com.indooratlas.android.sdk.IALocation;
import com.indooratlas.android.sdk.IALocationListener;
import com.indooratlas.android.sdk.IALocationManager;
import com.indooratlas.android.sdk.IARegion;

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
public class IndoorLocationListener implements IALocationListener, IARegion.Listener {
    private static final String TAG = "IndoorLocationListener";

    private static final int TRANSITION_TYPE_UNKNOWN = 0;
    private static final int TRANSITION_TYPE_ENTER = 1;
    private static final int TRANSITION_TYPE_EXIT = 2;

    private HashMap<String, CallbackContext> watches = new HashMap<String, CallbackContext>();
    private HashMap<String, CallbackContext> regionWatches = new HashMap<String, CallbackContext>();
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
     * Adds getCurrentPosition JS callback to the collection
     * @param callbackContext
     */
    public void addCallback(CallbackContext callbackContext) {
        mCallbacks.add(callbackContext);
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
     * Returns a JSON object which contains IARegion info.
     * @param iaRegion
     * @param transitionType
     * @return
     */
    private JSONObject getRegionJSONFromIARegion(IARegion iaRegion, int transitionType) {
        try {
            JSONObject regionData = ew JSONObject();
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
        owner.cancelTimer();
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
        switch (status) {
            case IALocationManager.STATUS_AVAILABLE:
                Log.d(TAG, provider);
                break;
            case IALocationManager.STATUS_LIMITED:
                Log.d(TAG, provider);
                handleServiceInteruption();
                break;
            case IALocationManager.STATUS_OUT_OF_SERVICE:
                Log.d(TAG, provider);
                handleServiceInteruption();
                break;
            case IALocationManager.STATUS_TEMPORARILY_UNAVAILABLE:
                Log.d(TAG, provider);
                handleServiceInteruption();
                break;
        }
    }
}

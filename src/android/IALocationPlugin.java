package com.ialocation.plugin;

import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Matrix;
import android.graphics.Point;
import android.graphics.PointF;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;
import android.content.Context;

import com.indooratlas.android.sdk.IALocation;
import com.indooratlas.android.sdk.IALocationManager;
import com.indooratlas.android.sdk.IALocationRequest;
import com.indooratlas.android.sdk.IARegion;
import com.indooratlas.android.sdk.resources.IAFloorPlan;
import com.indooratlas.android.sdk.resources.IALatLng;
import com.indooratlas.android.sdk.resources.IAResourceManager;
import com.indooratlas.android.sdk.resources.IAResult;
import com.indooratlas.android.sdk.resources.IAResultCallback;
import com.indooratlas.android.sdk.resources.IATask;
import com.indooratlas.android.sdk.IAOrientationRequest;
import com.indooratlas.android.sdk.IAOrientationListener;
import com.indooratlas.android.wayfinding.IARoutingLeg;
import com.indooratlas.android.wayfinding.IARoutingPoint;
import com.indooratlas.android.wayfinding.IAWayfinder;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Set;
import java.util.Timer;
import java.util.TimerTask;
import java.util.ArrayList;

/**
 * Cordova Plugin which implements IndoorAtlas positioning service.
 * IndoorAtlas.initialize method should always be called before starting positioning session.
 */
public class IALocationPlugin extends CordovaPlugin{
    private static final String TAG = "IALocationPlugin";
    private static final int PERMISSION_REQUEST = 101;

    private IALocationManager mLocationManager;
    private IAResourceManager mResourceManager;
    private IATask<IAFloorPlan> mFetchFloorplanTask;
    private String[] permissions = new String[]{
            Manifest.permission.CHANGE_WIFI_STATE,
            Manifest.permission.ACCESS_WIFI_STATE,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.INTERNET
    };
    private CallbackContext mCbContext;
    private IndoorLocationListener mListener;
    private boolean mLocationServiceRunning = false;
    private Timer mTimer;
    private String mApiKey, mApiSecret;
    private IALocationRequest mLocationRequest = IALocationRequest.create();
    private IAOrientationRequest mOrientationRequest = new IAOrientationRequest(1.0, 1.0);

    private IAWayfinder wayfinder;
    private ArrayList<IAWayfinder> wayfinderInstances = new ArrayList<IAWayfinder>();

    /**
     * Called by the WebView implementation to check for geolocation permissions, can be used
     * by other Java methods in the event that a plugin is using this as a dependency.
     * @return Returns true if the plugin has all the permissions it needs to operate.
     */
    @Override
    public boolean hasPermisssion() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return true;
        }
        for (String p : permissions) {
            if (PackageManager.PERMISSION_DENIED == cordova.getActivity().checkSelfPermission(p)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Called by the Plugin Manager when we need to actually request permissions
     * @param requestCode   Passed to the activity to track the request
     *
     */
    @Override
    public void requestPermissions(int requestCode) {
        cordova.requestPermissions(this, requestCode, permissions);
    }

    /**
     * Called by the system when the user grants permissions
     * @param requestCode
     * @param permissions
     * @param grantResults
     * @throws JSONException
     */
    @Override
    public void onRequestPermissionResult(int requestCode, String[] permissions, int[] grantResults) throws JSONException {
        PluginResult result;
        for (int grantResult : grantResults) {
            if (grantResult == PackageManager.PERMISSION_DENIED) {
                result = new PluginResult(PluginResult.Status.ERROR, PositionError.getErrorObject(PositionError.PERMISSION_DENIED));
                mCbContext.sendPluginResult(result);
                return;
            }
        }
        if (PERMISSION_REQUEST == requestCode) {
            result = new PluginResult(PluginResult.Status.OK);
            mCbContext.sendPluginResult(result);
        }
        mCbContext = null;
    }

    /**
     * Executes the request.
     * This method is called from the WebView thread. To do a non-trivial amount of work, use:
     *     cordova.getThreadPool().execute(runnable);
     *     To run on the UI thread, use:
     *     cordova.getActivity().runOnUiThread(runnable);
     * @param action          The action to execute.
     * @param args            The exec() arguments.
     * @param callbackContext The callback context used when calling back into JavaScript.
     * @return
     * @throws JSONException
     */
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        try{
            if ("initializeIndoorAtlas".equals(action)) {
                if (validateIAKeys(args)) {
                    String apiKey = args.getString(0);
                    String apiSecret = args.getString(1);
                    initializeIndoorAtlas(apiKey, apiSecret);
                    callbackContext.success();
                }
                else {
                    callbackContext.error(PositionError.getErrorObject(PositionError.INVALID_ACCESS_TOKEN));
                }
            } else if ("addWatch".equals(action)) {
                String watchId = args.getString(0);
                addWatch(watchId,callbackContext);
                if (!mLocationServiceRunning) {
                    startPositioning(callbackContext);
                }
            } else if ("clearWatch".equals(action)) {
                String watchId = args.getString(0);
                clearWatch(watchId);
                callbackContext.success();

            } else if ("getLocation".equals(action)) {
                if (mLocationServiceRunning) { //get last known location if service has started.
                    getLastKnownLocation(callbackContext);
                }
                else { //Start service
                    getListener(this).addCallback(callbackContext);
                    startPositioning(callbackContext);
                }
            } else if ("getPermissions".equals(action)) {
                if (hasPermisssion()) {
                    callbackContext.success();
                    return true;
                }
                else {
                    mCbContext = callbackContext;
                    requestPermissions(PERMISSION_REQUEST);
                }
            } else if ("setPosition".equals(action)) {
                setPosition(args, callbackContext);
            } else if ("addRegionWatch".equals(action)) {
                String watchId = args.getString(0);
                if (!mLocationServiceRunning){
                    startPositioning(callbackContext);
                }
                addRegionWatch(watchId, callbackContext);
            } else if ("clearRegionWatch".equals(action)) {
                String watchId = args.getString(0);
                clearRegionWatch(watchId);
                callbackContext.success();
            } else if("fetchFloorplan".equals(action)) {
                if (!args.getString(0).isEmpty()) {
                    String floorplanId = args.getString(0);
                    fetchFloorplan(floorplanId, callbackContext);
                } else {
                    callbackContext.error(PositionError.getErrorObject(PositionError.FLOOR_PLAN_UNDEFINED));
                }
            } else if ("coordinateToPoint".equals(action)) {
                IALatLng coords = new IALatLng(args.getDouble(0), args.getDouble(1));
                String floorplanId = args.getString(2);
                coordinateToPoint(coords, floorplanId, callbackContext);
            } else if ("pointToCoordinate".equals(action)) {
                PointF point = new PointF(args.getInt(0), args.getInt(1));
                String floorplanId = args.getString(2);
                pointToCoordinate(point, floorplanId, callbackContext);
            } else if ("setDistanceFilter".equals(action)) {
                float distance = (float) args.getDouble(0);
                setDistanceFilter(distance, callbackContext);
            } else if ("getTraceId".equals(action)) {
              getTraceId(callbackContext);
            } else if ("getFloorCertainty".equals(action)) {
              getFloorCertainty(callbackContext);
            } else if ("addAttitudeCallback".equals(action)) {
              addAttitudeCallback(callbackContext);
            } else if ("removeAttitudeCallback".equals(action)) {
              removeAttitudeCallback();
            } else if ("addHeadingCallback".equals(action)) {
              addHeadingCallback(callbackContext);
            } else if ("removeHeadingCallback".equals(action)) {
              removeHeadingCallback();
            } else if ("setSensitivities".equals(action)) {
              double orientationSensitivity = args.getDouble(0);
              double headingSensitivity = args.getDouble(1);
              setSensitivities(orientationSensitivity, headingSensitivity, callbackContext);
            } else if ("addStatusChangedCallback".equals(action)) {
              addStatusChangedCallback(callbackContext);
            } else if ("removeStatusCallback".equals(action)) {
              removeStatusCallback();
            } else if ("buildWayfinder".equals(action)) {
                String graphJson = args.getString(0);
                buildWayfinder(graphJson, callbackContext);
            } else if ("computeRoute".equals(action)) {
                int wayfinderId = args.getInt(0);
                Double lat0 = args.getDouble(1);
                Double lon0 = args.getDouble(2);
                int floor0 = args.getInt(3);
                Double lat1 = args.getDouble(4);
                Double lon1 = args.getDouble(5);
                int floor1 = args.getInt(6);
                computeRoute(wayfinderId, lat0, lon0, floor0, lat1, lon1, floor1, callbackContext);
            }
        }
        catch(Exception ex) {
            Log.e(TAG,ex.toString());
            callbackContext.error(PositionError.getErrorObject(PositionError.UNSPECIFIED_ERROR,ex.toString()));
            return false;
        }
        return true;
    }

    /**
     * The final call you receive before your activity is destroyed.
     */
    @Override
    public void onDestroy() {
        if (mLocationManager != null){
            mLocationManager.destroy();
        }
        super.onDestroy();
    }

    /**
     * Gets last known saved position from IndoorLocationListener
     * @param callbackContext
     */
    private void getLastKnownLocation(CallbackContext callbackContext)throws JSONException {
        JSONObject locationData;
        if (mListener != null) {
            locationData = mListener.getLastKnownLocation();
            if (locationData != null) {
                callbackContext.success(locationData);
            }
            else {
                callbackContext.error(PositionError.getErrorObject(PositionError.POSITION_UNAVAILABLE));
            }
        }
        else {
            callbackContext.error(PositionError.getErrorObject(PositionError.POSITION_UNAVAILABLE));
        }
    }

    /**
     * Initialized location manger with given key and secret
     * @param apiKey
     * @param apiSecret
     */
    private void initializeIndoorAtlas(final String apiKey, final String apiSecret) {
        if (mLocationManager == null){
            cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Bundle bundle = new Bundle(2);
                    bundle.putString(IALocationManager.EXTRA_API_KEY, apiKey);
                    bundle.putString(IALocationManager.EXTRA_API_SECRET, apiSecret);
                    mLocationManager = IALocationManager.create(cordova.getActivity().getApplicationContext(), bundle);
                    mResourceManager = IAResourceManager.create(cordova.getActivity().getApplicationContext(), bundle);
                    mApiKey = apiKey;
                    mApiSecret = apiSecret;
                }
            });
        }
    }

    /**
     * Starts tasks to fetch floorplan from IA
     * @param floorplanId
     * @param callbackContext
     */
    private void fetchFloorplan(String floorplanId, CallbackContext callbackContext) {
        if (mResourceManager != null) {
            cancelPendingNetworkCalls();
            mCbContext = callbackContext;
            mFetchFloorplanTask = mResourceManager.fetchFloorPlanWithId(floorplanId);
            mFetchFloorplanTask.setCallback(new IAResultCallback<IAFloorPlan>() {
                @Override
                public void onResult(IAResult<IAFloorPlan> iaResult) {
                    IAFloorPlan floorPlan;
                    JSONObject floorplanInfo;
                    JSONArray latlngArray;
                    floorPlan = iaResult.getResult();
                    IALatLng iaLatLng;
                    try {
                        if (floorPlan != null) {
                            floorplanInfo = new JSONObject();
                            floorplanInfo.put("id", floorPlan.getId());
                            floorplanInfo.put("name", floorPlan.getName());
                            floorplanInfo.put("url", floorPlan.getUrl());
                            floorplanInfo.put("floorLevel", floorPlan.getFloorLevel());
                            floorplanInfo.put("bearing", floorPlan.getBearing());
                            floorplanInfo.put("bitmapHeight", floorPlan.getBitmapHeight());
                            floorplanInfo.put("bitmapWidth", floorPlan.getBitmapWidth());
                            floorplanInfo.put("heightMeters", floorPlan.getHeightMeters());
                            floorplanInfo.put("widthMeters", floorPlan.getWidthMeters());
                            floorplanInfo.put("metersToPixels", floorPlan.getMetersToPixels());
                            floorplanInfo.put("pixelsToMeters", floorPlan.getPixelsToMeters());

                            latlngArray = new JSONArray();
                            iaLatLng = floorPlan.getBottomLeft();
                            latlngArray.put(iaLatLng.longitude);
                            latlngArray.put(iaLatLng.latitude);
                            floorplanInfo.put("bottomLeft", latlngArray);

                            latlngArray = new JSONArray();
                            iaLatLng = floorPlan.getCenter();
                            latlngArray.put(iaLatLng.longitude);
                            latlngArray.put(iaLatLng.latitude);
                            floorplanInfo.put("center", latlngArray);

                            latlngArray = new JSONArray();
                            iaLatLng = floorPlan.getTopLeft();
                            latlngArray.put(iaLatLng.longitude);
                            latlngArray.put(iaLatLng.latitude);
                            floorplanInfo.put("topLeft", latlngArray);

                            latlngArray = new JSONArray();
                            iaLatLng = floorPlan.getTopRight();
                            latlngArray.put(iaLatLng.longitude);
                            latlngArray.put(iaLatLng.latitude);
                            floorplanInfo.put("topRight", latlngArray);

                            PluginResult pluginResult;
                            pluginResult = new PluginResult(PluginResult.Status.OK, floorplanInfo);
                            pluginResult.setKeepCallback(true);
                            mCbContext.sendPluginResult(pluginResult);

                        }
                        else {
                          PluginResult pluginResult;
                          pluginResult = new PluginResult(PluginResult.Status.ERROR, PositionError.getErrorObject(PositionError.FLOOR_PLAN_UNAVAILABLE));
                          pluginResult.setKeepCallback(true);
                          mCbContext.sendPluginResult(pluginResult);
                        }
                    }
                    catch(JSONException ex) {
                        Log.e(TAG, ex.toString());
                        throw new IllegalStateException(ex.getMessage());
                    }
                }
            }, Looper.getMainLooper());
        }
        else {
            callbackContext.error(PositionError.getErrorObject(PositionError.INITIALIZATION_ERROR));
        }
    }

    /**
     * Calculates point based on given coordinates
     * @param coords
     * @param floorplanId
     * @param callbackContext
     */
    private void coordinateToPoint(final IALatLng coords, String floorplanId, final CallbackContext callbackContext) {
        if (mResourceManager != null) {
            IATask<IAFloorPlan> fetchFloorplanTask = mResourceManager.fetchFloorPlanWithId(floorplanId);
            fetchFloorplanTask.setCallback(new IAResultCallback<IAFloorPlan>() {
                @Override
                public void onResult(IAResult<IAFloorPlan> iaResult) {
                    JSONObject pointInfo = new JSONObject();
                    IAFloorPlan floorPlan = iaResult.getResult();
                    try {
                        if (floorPlan != null) {
                            PointF point = floorPlan.coordinateToPoint(coords);
                            pointInfo.put("x", point.x);
                            pointInfo.put("y", point.y);
                            callbackContext.success(pointInfo);
                        } else {
                            callbackContext.error(PositionError.getErrorObject(PositionError.FLOOR_PLAN_UNAVAILABLE));
                        }

                    } catch (JSONException ex) {
                        Log.e(TAG, ex.toString());
                        throw new IllegalStateException(ex.getMessage());
                    }
                }
            }, Looper.getMainLooper());
        } else {
            callbackContext.error(PositionError.getErrorObject(PositionError.INITIALIZATION_ERROR));
        }
    }

    /**
     * Calculates coordinates based on given point
     * @param point
     * @param floorplanId
     * @param callbackContext
     */
    private void pointToCoordinate(final PointF point, String floorplanId, final CallbackContext callbackContext) {
        if (mResourceManager != null) {
            IATask<IAFloorPlan> fetchFloorplanTask = mResourceManager.fetchFloorPlanWithId(floorplanId);
            fetchFloorplanTask.setCallback(new IAResultCallback<IAFloorPlan>() {
                @Override
                public void onResult(IAResult<IAFloorPlan> iaResult) {
                    JSONObject coordsInfo = new JSONObject();
                    IAFloorPlan floorPlan = iaResult.getResult();
                    try {
                        if (floorPlan != null) {
                            IALatLng coords = floorPlan.pointToCoordinate(point);
                            coordsInfo.put("latitude", coords.latitude);
                            coordsInfo.put("longitude", coords.longitude);
                            callbackContext.success(coordsInfo);
                        } else {
                            callbackContext.error(PositionError.getErrorObject(PositionError.FLOOR_PLAN_UNAVAILABLE));
                        }
                    } catch (JSONException ex) {
                        Log.e(TAG, ex.toString());
                        throw new IllegalStateException(ex.getMessage());
                    }
                }
            }, Looper.getMainLooper());
        } else {
            callbackContext.error(PositionError.getErrorObject(PositionError.INITIALIZATION_ERROR));
        }
    }

    /**
     * Helper method to cancel current task if any.
     */
    private void cancelPendingNetworkCalls() {
        if (mFetchFloorplanTask != null) {
            if (!mFetchFloorplanTask.isCancelled()) {
                mFetchFloorplanTask.cancel();
                mCbContext.sendPluginResult(new PluginResult(PluginResult.Status.NO_RESULT));
            }
        }
    }

    /**
     * Adds a new callback to the IndoorAtlas location listener
     * @param watchId
     * @param callbackContext
     */
    private void addWatch(String watchId, CallbackContext callbackContext) {
        getListener(this).addWatch(watchId, callbackContext);
    }

    /**
     * Adds a new callback to the IndoorAtlas IARegion.Listener
     */
    private void addRegionWatch(String watchId, CallbackContext callbackContext) {
        getListener(this).addRegionWatch(watchId, callbackContext);
    }

    /**
     * Adds a new callback to the IndoorAtlas IAAttitude.Listener
     */
    private void addAttitudeCallback(CallbackContext callbackContext) {
      getListener(this).addAttitudeCallback(callbackContext);
    }

    /**
     * Adds a new callback to the IndoorAtlas IAAttitude.Listener
     */
    private void addHeadingCallback(CallbackContext callbackContext) {
      getListener(this).addHeadingCallback(callbackContext);
    }

    /**
     * Adds a new callback to the IndoorAtlas IAAttitude.Listener
     */
    private void addStatusChangedCallback(CallbackContext callbackContext) {
      getListener(this).addStatusChangedCallback(callbackContext);
    }

    /**
     * Removes callback from IndoorAtlas location listener
     * @param watchId
     */
    private void clearWatch(String watchId) {
        getListener(this).clearWatch(watchId);
    }

    /**
     * Removes callback from IndoorAtlas IARegion.Listener
     * @param watchId
     */
    private void clearRegionWatch(String watchId) {
        getListener(this).clearRegionWatch(watchId);
    }

    /**
     * Removes callback from IndoorAtlas location listener
     */
    private void removeAttitudeCallback() {
      getListener(this).removeAttitudeCallback();
    }

    /**
     * Removes callback from IndoorAtlas location listener
     */
     private void removeHeadingCallback() {
       getListener(this).removeHeadingCallback();
     }

     /**
      * Removes callback from IndoorAtlas location listener
      */
     private void removeStatusCallback() {
       getListener(this).removeStatusCallback();
     }
    
    /**
     * Initialize the graph with the given graph JSON
     */
    private void buildWayfinder(final String graphJson, CallbackContext callbackContext) {
        int wayfinderId = wayfinderInstances.size();

        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Context context = cordova.getActivity().getApplicationContext();
                wayfinder = IAWayfinder.create(context, graphJson);
                wayfinderInstances.add(wayfinder);
            }
        });
        
        JSONObject result = new JSONObject();
        try {
            result.put("wayfinderId", wayfinderId);
            callbackContext.success(result);
            
        } catch (JSONException e) {
            Log.e("IAWAYFINDER", "wayfinderId was not set");
        };
    }
    
    /**
     * Compute route for the given values;
     * 1) Set location of the wayfinder instance
     * 2) Set destination of the wayfinder instance
     * 3) Get route between the given location and destination
     */
    private void computeRoute(int wayfinderId, Double lat0, Double lon0, int floor0, Double lat1, Double lon1, int floor1, CallbackContext callbackContext) {
        wayfinder = wayfinderInstances.get(wayfinderId);
        wayfinder.setLocation(lat0, lon0, floor0);
        wayfinder.setDestination(lat1, lon1, floor1);
        
        IARoutingLeg[] legs = wayfinder.getRoute();
        JSONArray jsonArray = new JSONArray();
        for (int i = 0; i < legs.length; i++) {
            jsonArray.put(jsonObjectFromRoutingLeg(legs[i]));
        }
        JSONObject result = new JSONObject();
        
        try {
            result.put("route", jsonArray);
            callbackContext.success(result);
        } catch(JSONException e) {
            Log.e("IAWAYFINDER", "json error with route");
        }
    }
    
    /**
     * Create JSON object from the given RoutingLeg object
     */
    private JSONObject jsonObjectFromRoutingLeg(IARoutingLeg routingLeg) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("begin", jsonObjectFromRoutingPoint(routingLeg.getBegin()));
            obj.put("end", jsonObjectFromRoutingPoint(routingLeg.getEnd()));
            obj.put("length", routingLeg.getLength());
            obj.put("direction", routingLeg.getDirection());
            obj.put("edgeIndex", routingLeg.getEdgeIndex());
        } catch(JSONException e) {
            
        }
        return obj;
    }
    
    /**
     * Create JSON object from RoutingPoint object
     */
    private JSONObject jsonObjectFromRoutingPoint(IARoutingPoint routingPoint) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("latitude", routingPoint.getLatitude());
            obj.put("longitude", routingPoint.getLongitude());
            obj.put("floor", routingPoint.getFloor());
        } catch(JSONException e) {
            
        }
        return obj;
    }

    /**
     * Set sensitivities for orientation and heading filter
     */
     private void setSensitivities(double orientationSensitivity, double headingSensitivity, CallbackContext callbackContext) {
       mOrientationRequest = new IAOrientationRequest(headingSensitivity, orientationSensitivity);
       cordova.getActivity().runOnUiThread(new Runnable() {
           @Override
           public void run() {
             mLocationManager.unregisterOrientationListener(getListener(IALocationPlugin.this));
             mLocationManager.registerOrientationListener(mOrientationRequest, getListener(IALocationPlugin.this));
           }
       });

       JSONObject successObject = new JSONObject();
       try {
           successObject.put("message","Sensitivies set");
       } catch (JSONException ex) {
           throw new IllegalStateException(ex.getMessage());
       }
       callbackContext.success(successObject);
     }

    /**
     * Resets IndoorAtlas positioning session (NOT BEING USED)
     */
    public void resetIndoorAtlas() {
        stopPositioning();
        initializeIndoorAtlas(mApiKey, mApiSecret);
        startPositioning();
    }

    /**
     * Validates parameters passed by user before initializing IALocationManager
     * @param args
     * @return
     * @throws JSONException
     */
    private boolean validateIAKeys(JSONArray args) throws JSONException {
        String apiKey = args.getString(0);
        String apiSecret = args.getString(1);
        if (apiKey.trim().equalsIgnoreCase("")) {
            return false;
        }
        if (apiSecret.trim().equalsIgnoreCase("")) {
            return false;
        }
        return true;
    }

    /**
     * Validates parameters passed by user before calling IALocationManager.setLocation
     * @param args
     * @return
     * @throws JSONException
     */
    private boolean validatePositionArguments(JSONArray args) throws JSONException {
        if (!args.getString(0).trim().equalsIgnoreCase("")) {
            return true;
        }
        if (args.getJSONArray(1).length() == 2){
            return true;
        }
        return false;
    }

    /**
     * Set explicit position of IALocationManager using either a region or geo-coordinates
     * @param args
     * @param callbackContext
     * @throws Exception
     */
    private void setPosition(final JSONArray args,final CallbackContext callbackContext) throws Exception {
        final IALocation.Builder builder;
        if (mLocationManager != null){
            if (validatePositionArguments(args)) {
                builder = new IALocation.Builder();
                if (!args.getString(0).trim().equalsIgnoreCase("")) {
                    builder.withRegion(IARegion.floorPlan(args.getString(0).trim()));
                }
                if (args.getJSONArray(1).length() == 2) {
                    builder.withLatitude(args.getJSONArray(1).getDouble(0));
                    builder.withLongitude(args.getJSONArray(1).getDouble(1));
                }
                cordova.getActivity().runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        IALocation iaLocation;
                        iaLocation = builder.build();
                        mLocationManager.setLocation(iaLocation);
                        JSONObject successObject = new JSONObject();
                        try {
                            successObject.put("message","Position set");
                        } catch (JSONException ex) {
                            Log.e(TAG, ex.toString());
                            throw new IllegalStateException(ex.getMessage());
                        }
                        callbackContext.success(successObject);
                    }
                });
            }
        }
        else {
            callbackContext.error(PositionError.getErrorObject(PositionError.INITIALIZATION_ERROR));
        }
    }

    /**
     * Starts IndoorAtlas positioning session
     * @param callbackContext
     */
    protected void startPositioning(CallbackContext callbackContext) {
        if (mLocationManager != null) {
            startPositioning();
        }
        else {
            callbackContext.error(PositionError.getErrorObject(PositionError.INITIALIZATION_ERROR));
        }
    }

    private void setDistanceFilter(float distance, CallbackContext callbackContext) {
        stopPositioning();
        if (distance >= 0) {
            mLocationRequest.setSmallestDisplacement(distance);
            JSONObject successObject = new JSONObject();
            try {
                successObject.put("message","Distance filter set");
            } catch (JSONException ex) {
                Log.e(TAG, ex.toString());
                throw new IllegalStateException(ex.getMessage());
            }
            callbackContext.success(successObject);
            startPositioning();
        } else {
            callbackContext.error(PositionError.getErrorObject(PositionError.INVALID_VALUE));
        }
    }

    private void getTraceId(CallbackContext callbackContext) {
      JSONObject data;
      data = new JSONObject();
      try {
          data.put("traceId", mLocationManager.getExtraInfo().traceId);
      } catch (JSONException ex) {
          Log.e(TAG, ex.toString());
          throw new IllegalStateException(ex.getMessage());
      }
      callbackContext.success(data);
    }

    private void getFloorCertainty(CallbackContext callbackContext) {

      if (mListener != null) {
        if(mListener.lastKnownLocation != null) {
          if (mListener.lastKnownLocation.hasFloorCertainty()) {
            JSONObject data;
            data = new JSONObject();
            try {
              data.put("floorCertainty", mListener.lastKnownLocation.getFloorCertainty());

            } catch (JSONException ex) {
              Log.e(TAG, ex.toString());
              throw new IllegalStateException(ex.getMessage());
            }
            callbackContext.success(data);
          }
        } else {
          callbackContext.error("No floor certainty");
        }
      } else {
        callbackContext.error("No floor certainty");
      }
    }

    /**
     * Starts IndoorAtlas positioning session
     */
    protected void startPositioning() {
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mLocationManager.requestLocationUpdates(mLocationRequest, getListener(IALocationPlugin.this));
                mLocationManager.registerRegionListener(getListener(IALocationPlugin.this));
                mLocationManager.registerOrientationListener(mOrientationRequest, getListener(IALocationPlugin.this));
                mLocationServiceRunning = true;
            }
        });
    }

    /**
     * Stops IndoorAtlas positioning session
     */
    protected void stopPositioning() {
        if (mLocationManager != null) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    mLocationManager.unregisterRegionListener(getListener(IALocationPlugin.this));
                    mLocationManager.removeLocationUpdates(getListener(IALocationPlugin.this));
                    mLocationManager.unregisterOrientationListener(getListener(IALocationPlugin.this));
                    mLocationServiceRunning = false;
                }
            });
        }
    }

    /**
     * Checks if application manifest contains IndoorAtlas key and secret(NOT BEING USED).
     * @return
     * @throws PackageManager.NameNotFoundException
     */
    private boolean isValidManifest()throws PackageManager.NameNotFoundException {
        Bundle bundle;
        bundle = cordova.getActivity().getPackageManager().getApplicationInfo(cordova.getActivity().getPackageName(), PackageManager.GET_META_DATA).metaData;
        if (!bundle.containsKey("com.indooratlas.android.sdk.API_KEY")) {
            return false;
        }
        if (!bundle.containsKey("com.indooratlas.android.sdk.API_SECRET")) {
            return false;
        }
        return true;
    }

    /**
     * Returns IndoorLocationListener class object
     * @param plugin
     * @return
     */
    private IndoorLocationListener getListener(IALocationPlugin plugin) {
        if (mListener == null){
            mListener = new IndoorLocationListener(plugin);
        }
        return mListener;
    }

    /**
     * Cancels the timeout timer used in getCurrentPosition and addWatch methods.
     */
    public void cancelTimer() {
        if (mTimer != null) {
            mTimer.cancel();
            mTimer.purge();
            mTimer = null;
        }
    }

    /**
     * Creates timeout timer used in getCurrentPosition and addWatch methods.
     * @param callbackContext
     * @param timeout
     */
    private void scheduleTimer(CallbackContext callbackContext, int timeout) {
        if (mTimer == null) {
            mTimer = new Timer();
        }
        mTimer.schedule(new TimeoutTask(callbackContext, getListener(this)), timeout);
    }
    /**
     * TimerTask which implements timeout logic when fetching position.
     */
    private class TimeoutTask extends TimerTask {
        private CallbackContext mCallbackContext = null;
        private IndoorLocationListener mListener = null;

        public TimeoutTask(CallbackContext callbackContext, IndoorLocationListener listener) {
            mCallbackContext = callbackContext;
            mListener = listener;
        }
        @Override
        public void run() {
            PluginResult pluginResult;
            JSONObject errorObject;
            for (CallbackContext callbackContext : mListener.getCallbacks()) {
                if (mCallbackContext == callbackContext) {
                    callbackContext.error(PositionError.getErrorObject(PositionError.TIMEOUT));
                    mListener.getCallbacks().remove(callbackContext);
                    break;
                }
            }
            Set<String> keys = mListener.getWatches().keySet();
            for(String key: keys) {
                if (mCallbackContext == mListener.getWatches().get(key)) {
                    mListener.getWatches().get(key).error(PositionError.getErrorObject(PositionError.TIMEOUT));
                    mListener.getWatches().remove(key);
                }
            }
            if (mListener.size() == 0) {
                stopPositioning();
            }
        }
    }

}

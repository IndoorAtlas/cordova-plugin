package com.iawayfinding.plugin;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import java.util.ArrayList;

import com.indooratlas.android.wayfinding.IARoutingLeg;
import com.indooratlas.android.wayfinding.IARoutingPoint;
import com.indooratlas.android.wayfinding.IAWayfinder;

/**
 * IAWayfinding wrapper for Android
 */
public class IAWayfinding extends CordovaPlugin {

    private IAWayfinder wayfinder;
    private ArrayList<IAWayfinder> wayfinderInstances = new ArrayList<IAWayfinder>();

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        if (action.equals("initWithGraph")) {
            String graphJson = args.getString(0);
            initWithGraph(graphJson, callbackContext);
            return true;
        } else if (action.equals("computeRoute")) {
            int wayfinderId = args.getInt(0);
            Double lat0 = args.getDouble(1);
            Double lon0 = args.getDouble(2);
            int floor0 = args.getInt(3);
            Double lat1 = args.getDouble(4);
            Double lon1 = args.getDouble(5);
            int floor1 = args.getInt(6);
            computeRoute(wayfinderId, lat0, lon0, floor0, lat1, lon1, floor1, callbackContext);
            return true;
        }
        return false;
    }

    /**
     * Initialize the graph with the given graph JSON
     */
    private void initWithGraph(String graphJson, CallbackContext callbackContext) {
        int wayfinderId = wayfinderInstances.size();
        wayfinder = IAWayfinder.create(graphJson);
        wayfinderInstances.add(wayfinder);

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
}
